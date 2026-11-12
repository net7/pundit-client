import { describe as describeRange } from '@net7/annotator';
import { prepareAiRequest } from './annotation-range-selector.util';

const PAGE = `
  <p id="one">Comune di <em>Viterbo</em> si trova vicino al lago</p>
  <p id="two">Il <b>lago</b> di Bolsena è vulcanico</p>
`;

/** The pending annotation payload the client builds from a selection. */
const payloadFor = (range: Range) => {
  const selected: any = { text: range.toString() };
  describeRange(document.body, range).forEach((selector: any) => {
    const { type, ...rest } = selector;
    if (type === 'RangeSelector') selected.rangeSelector = rest;
    if (type === 'TextPositionSelector') selected.textPositionSelector = rest;
    if (type === 'TextQuoteSelector') selected.textQuoteSelector = rest;
  });
  return { subject: { selected } };
};

/** A range from `startText` (offset `startOffset`) to `endText` (offset `endOffset`). */
const select = (startText: string, startOffset: number, endText: string, endOffset: number) => {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const find = (text: string) => nodes.find((node) => node.textContent === text)!;
  const range = document.createRange();
  range.setStart(find(startText), startOffset);
  range.setEnd(find(endText), endOffset);
  return range;
};

const segmentTexts = async (payload: any) => {
  const prepared = await prepareAiRequest(payload, 'task', 'comment');
  return prepared?.request.segments.map(({ text }) => text);
};

describe('prepareAiRequest', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
  });

  it('sends a selection that starts inside formatted text, not the text before it', async () => {
    // "si trova vicino" in " si trova vicino al lago"
    const payload = payloadFor(select(' si trova vicino al lago', 1, ' si trova vicino al lago', 16));
    document.body.innerHTML = PAGE; // fresh DOM: the request anchors from the stored selectors only
    expect(await segmentTexts(payload)).toEqual(['si trova vicino']);
  });

  it('sends exactly the selection across formatting', async () => {
    // "di Viterbo si trova"
    const payload = payloadFor(select('Comune di ', 7, ' si trova vicino al lago', 9));
    document.body.innerHTML = PAGE;
    const prepared = await prepareAiRequest(payload, 'task', 'comment');
    expect(prepared?.request).toEqual({
      segments: [
        { id: 'c1', text: 'di ' }, { id: 'c2', text: 'Viterbo' }, { id: 'c3', text: ' si trova' },
      ],
      prompt: 'task',
      annotation_type: 'comment',
    });
    expect(prepared?.segmentMap.get('c2')?.textContent).toBe('Viterbo');
  });

  it('sends only the selected part of each paragraph across paragraphs', async () => {
    // "vicino al lago" ... "Il lago"
    const payload = payloadFor(select(' si trova vicino al lago', 10, 'lago', 4));
    document.body.innerHTML = PAGE;
    const texts = await segmentTexts(payload);
    expect(texts).toEqual(['vicino al lago', '\n  ', 'Il ', 'lago']);
    expect(texts?.join('')).toBe('vicino al lago\n  Il lago');
    expect(texts?.join('')).not.toContain('Comune');
    expect(texts?.join('')).not.toContain('Bolsena');
  });

  it('sends a whitespace-only node between two nodes, untrimmed and mapped to its node', async () => {
    document.body.innerHTML = '<p><span>Her name is Portia, </span>\n      <span> To Cato\'s daughter</span></p>';
    const payload = payloadFor(select('Her name is Portia, ', 12, ' To Cato\'s daughter', 8));
    document.body.innerHTML = '<p><span>Her name is Portia, </span>\n      <span> To Cato\'s daughter</span></p>';
    const prepared = await prepareAiRequest(payload, 'task', 'highlight');

    expect(prepared?.request).toEqual({
      segments: [
        { id: 'c1', text: 'Portia, ' },
        { id: 'c2', text: '\n      ' },
        { id: 'c3', text: ' To Cato' },
      ],
      prompt: 'task',
      annotation_type: 'highlight',
    });
    expect(prepared?.request).not.toHaveProperty('selected_text');
    expect(prepared?.segmentMap.get('c2')?.textContent).toBe('\n      ');
    expect(prepared?.segmentMap.get('c2')?.isConnected).toBe(true);
  });

  it('sends no request when the selection is not in the page', async () => {
    const payload = payloadFor(select(' si trova vicino al lago', 1, ' si trova vicino al lago', 16));
    document.body.innerHTML = '<p>Altro testo</p>';
    expect(await prepareAiRequest(payload, 'task', 'comment')).toBeNull();
  });
});
