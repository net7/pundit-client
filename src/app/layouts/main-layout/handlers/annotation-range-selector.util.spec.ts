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

const chunkTexts = async (payload: any) => {
  const prepared = await prepareAiRequest(payload, 'task', 'comment');
  return prepared?.request.chunks.map(({ text }) => text);
};

describe('prepareAiRequest', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
  });

  it('sends a selection that starts inside formatted text, not the text before it', async () => {
    // "si trova vicino" in " si trova vicino al lago"
    const payload = payloadFor(select(' si trova vicino al lago', 1, ' si trova vicino al lago', 16));
    document.body.innerHTML = PAGE; // fresh DOM: the request anchors from the stored selectors only
    expect(await chunkTexts(payload)).toEqual(['si trova vicino']);
  });

  it('sends exactly the selection across formatting', async () => {
    // "di Viterbo si trova"
    const payload = payloadFor(select('Comune di ', 7, ' si trova vicino al lago', 9));
    document.body.innerHTML = PAGE;
    const prepared = await prepareAiRequest(payload, 'task', 'comment');
    expect(prepared?.request.chunks).toEqual([
      { id: 'c1', text: 'di ' }, { id: 'c2', text: 'Viterbo' }, { id: 'c3', text: ' si trova' },
    ]);
    expect(prepared?.request.selected_text).toBe('di Viterbo si trova');
    expect(prepared?.chunkMap.get('c2')?.textContent).toBe('Viterbo');
  });

  it('sends only the selected part of each paragraph across paragraphs', async () => {
    // "vicino al lago" ... "Il lago"
    const payload = payloadFor(select(' si trova vicino al lago', 10, 'lago', 4));
    document.body.innerHTML = PAGE;
    const texts = await chunkTexts(payload);
    expect(texts?.[0]).toBe('vicino al lago');
    expect(texts?.slice(-2)).toEqual(['Il ', 'lago']);
    expect(texts?.join('')).not.toContain('Comune');
    expect(texts?.join('')).not.toContain('Bolsena');
  });

  it('sends no request when the selection is not in the page', async () => {
    const payload = payloadFor(select(' si trova vicino al lago', 1, ' si trova vicino al lago', 16));
    document.body.innerHTML = '<p>Altro testo</p>';
    expect(await prepareAiRequest(payload, 'task', 'comment')).toBeNull();
  });
});
