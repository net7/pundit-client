import {
  PAGE_CONTEXT_TEXT_LIMIT,
  PAGE_TEXT_LIMIT,
  buildPageContext,
  buildWholePageContext,
  getPageMetadata,
  getPageText,
  getTextAround,
} from './ai-page-context.util';

const setHead = (html: string, title = '') => {
  document.head.innerHTML = html;
  document.title = title;
};

/** The text node with exactly `text`. */
const textNode = (text: string): Text => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode.textContent === text) return walker.currentNode as Text;
  }
  throw new Error(`no text node "${text}"`);
};

/** Text around a selection made of the single text node `<span id="sel">`. */
const around = (html: string) => {
  document.body.innerHTML = html;
  const node = document.getElementById('sel')!.firstChild as Text;
  return getTextAround(node, node);
};

const words = (count: number, word = 'parola') => Array.from({ length: count }, () => word).join(' ');

describe('getPageMetadata', () => {
  afterEach(() => setHead(''));

  it('reads Open Graph first', () => {
    setHead(`
      <meta property="og:title" content="Portia">
      <meta property="og:site_name" content="Shakespeare Wiki">
      <meta name="description" content="Heiress of Belmont">
      <meta property="og:description" content="A character">`, 'Portia – Wiki');
    expect(getPageMetadata()).toEqual({
      title: 'Portia', site: 'Shakespeare Wiki', description: 'Heiress of Belmont',
    });
  });

  it('falls back to the document title, the host name and og:description', () => {
    setHead('<meta property="og:description" content="A heiress">', 'Portia – Wiki');
    expect(getPageMetadata()).toEqual({
      title: 'Portia – Wiki', site: 'localhost', description: 'A heiress',
    });
  });

  it('falls back when a meta is blank, and collapses whitespace', () => {
    setHead('<meta property="og:title" content="  "><meta name="description" content=" ">', '  The \n Merchant  ');
    expect(getPageMetadata()).toEqual({ title: 'The Merchant', site: 'localhost' });
  });

  it('leaves out empty fields', () => {
    const doc = document.implementation.createHTMLDocument('');
    expect(getPageMetadata(doc)).toEqual({});
  });
});

describe('getTextAround', () => {
  it('takes the text right before and right after the selection', () => {
    expect(around('<p>Her name is <span id="sel">Portia</span>, nothing undervalued</p>')).toEqual({
      before: 'Her name is ',
      after: ', nothing undervalued',
    });
  });

  it('cuts at 1,500 characters without splitting words', () => {
    const long = words(500); // 3,499 characters
    const { before, after } = around(`<p>${long} </p><span id="sel">Portia</span><p> ${long}</p>`);
    for (const side of [before!, after!]) {
      expect(side.length).toBeLessThanOrEqual(PAGE_CONTEXT_TEXT_LIMIT);
      expect(side.length).toBeGreaterThan(PAGE_CONTEXT_TEXT_LIMIT - 'parola '.length);
      expect(side.trim().split(' ').every((word) => word === 'parola')).toBe(true);
    }
    // the side next to the selection is kept as in the page
    expect(before!.endsWith('parola ')).toBe(true);
    expect(after!.startsWith(' parola')).toBe(true);
  });

  it('cuts a word longer than the limit at the character', () => {
    const word = 'x'.repeat(2000);
    expect(around(`<p><span id="sel">Portia</span>${word}</p>`).after).toBe('x'.repeat(PAGE_CONTEXT_TEXT_LIMIT));
    expect(around(`<p>${word}<span id="sel">Portia</span></p>`).before).toBe('x'.repeat(PAGE_CONTEXT_TEXT_LIMIT));
  });

  it('skips script, style, noscript, template and Pundit\'s interface', () => {
    expect(around(`
      <p>Before <script>var a = 1;</script><style>p { color: red }</style><span id="sel">Portia</span></p>
      <noscript>Enable JS</noscript><template><p>Hidden</p></template>
      <pnd-root><div>Save all</div></pnd-root>
      <p>Next paragraph</p>`)).toEqual({ before: 'Before ', after: ' Next paragraph' });
  });

  it('reads existing highlights as page text', () => {
    expect(around('<p>Friend of <pnd-mark>Bassanio</pnd-mark> and <span id="sel">Portia</span></p>').before)
      .toBe('Friend of Bassanio and ');
  });

  it('joins nodes as they are, collapsing whitespace', () => {
    expect(around('<p>The end.</p>\n  <h2>Title</h2><p>\n   Text   here <span id="sel">Portia</span></p>').before)
      .toBe('The end. Title Text here ');
    // no space where the page has none
    expect(around('<p>The end.</p><h2>Title</h2><span id="sel">Portia</span>').before).toBe('The end.Title');
  });

  it('keeps words split by inline formatting or highlights whole', () => {
    expect(around(`<p><span id="sel">Portia</span> lake <b>Bol</b>sena, such a wa<pnd-mark>nt-wit</pnd-mark>
      sadness, in a <pnd-mark-preview>word</pnd-mark-preview>, but</p>`).after)
      .toBe(' lake Bolsena, such a want-wit sadness, in a word, but');
  });

  it('leaves out the empty side at the start and at the end of the document', () => {
    expect(around('<span id="sel">Portia</span> lives in Belmont')).toEqual({ after: ' lives in Belmont' });
    expect(around('Her name is <span id="sel">Portia</span>\n  ')).toEqual({ before: 'Her name is ' });
  });

  it('sends nothing when the page has no text outside the selection', () => {
    expect(around('<canvas></canvas><span id="sel">Portia</span><canvas></canvas>')).toEqual({});
  });

  it('starts from the boundary nodes of a selection across nodes', () => {
    document.body.innerHTML = '<p>Comune di <em>Viterbo</em> si trova</p>';
    expect(getTextAround(textNode('Comune di '), textNode('Viterbo'))).toEqual({ after: ' si trova' });
  });
});

describe('buildPageContext', () => {
  afterEach(() => setHead(''));

  it('joins metadata and text around', () => {
    setHead('', 'The Merchant of Venice');
    document.body.innerHTML = '<p>Act I. <span id="sel">Portia</span> enters</p>';
    const node = document.getElementById('sel')!.firstChild as Text;
    expect(buildPageContext(node, node)).toEqual({
      title: 'The Merchant of Venice', site: 'localhost', before: 'Act I. ', after: ' enters',
    });
  });

  it('sends only the metadata without selection nodes', () => {
    setHead('', 'The Merchant of Venice');
    expect(buildPageContext()).toEqual({ title: 'The Merchant of Venice', site: 'localhost' });
  });
});

describe('getPageText', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is the whole text of a short page, trimmed, whitespace runs collapsed', () => {
    const text = words(115); // 804 characters
    document.body.innerHTML = `\n  <h1>Title</h1>\n  <p>  ${text.replace(/ /g, '   ')}  </p>\n`;
    expect(getPageText()).toBe(`Title ${text}`);
  });

  it('stops at the limit without splitting a word', () => {
    document.body.innerHTML = `<p>first ${words(3000)}</p>`; // ~20,000 characters
    const text = getPageText();
    expect(PAGE_TEXT_LIMIT).toBe(6000);
    expect(text.length).toBeLessThanOrEqual(PAGE_TEXT_LIMIT);
    expect(text.length).toBeGreaterThan(PAGE_TEXT_LIMIT - 'parola '.length);
    expect(text.startsWith('first parola')).toBe(true);
    expect(text.endsWith(' parola')).toBe(true);
  });

  it('cuts a long word at the character', () => {
    document.body.innerHTML = `<p>${'a'.repeat(8000)}</p>`;
    expect(getPageText()).toBe('a'.repeat(PAGE_TEXT_LIMIT));
  });

  it('skips script, style, noscript, template and Pundit\'s interface', () => {
    document.body.innerHTML = `<script>var a = 1;</script><style>p { color: red }</style>
      <noscript>enable js</noscript><template>tpl</template><pnd-root><p>Pundit UI</p></pnd-root>
      <p>In sooth, I know not why I am so sad</p>`;
    expect(getPageText()).toBe('In sooth, I know not why I am so sad');
  });

  it('keeps words split by formatting or highlights whole', () => {
    document.body.innerHTML = '<p>lake <b>Bol</b>sena, a wa<pnd-mark>nt-wit</pnd-mark> sadness</p>';
    expect(getPageText()).toBe('lake Bolsena, a want-wit sadness');
  });

  it('is empty when the page has no DOM text', () => {
    document.body.innerHTML = '<canvas></canvas>\n  <canvas></canvas>';
    expect(getPageText()).toBe('');
  });
});

describe('buildWholePageContext', () => {
  afterEach(() => {
    setHead('');
    document.body.innerHTML = '';
  });

  it('joins metadata and the beginning of the page text, no text around', () => {
    setHead('<meta name="description" content="A comedy">', 'The Merchant of Venice');
    document.body.innerHTML = '<p>In sooth, I know not why I am so sad</p>';
    expect(buildWholePageContext()).toEqual({
      title: 'The Merchant of Venice',
      site: 'localhost',
      description: 'A comedy',
      text: 'In sooth, I know not why I am so sad',
    });
  });

  it('sends the metadata alone when the page has no DOM text', () => {
    setHead('', 'Scan.pdf');
    document.body.innerHTML = '<canvas></canvas>';
    expect(buildWholePageContext()).toEqual({ title: 'Scan.pdf', site: 'localhost' });
  });

  it('is undefined without title, description and text, even with a site', () => {
    setHead('<meta property="og:site_name" content="Wiki">');
    document.body.innerHTML = '<canvas></canvas>';
    expect(buildWholePageContext()).toBeUndefined();
  });
});
