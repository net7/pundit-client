import { AI_PREVIEW_ID_PREFIX, isAiPreviewId, withoutPreviewTriple } from './ai-preview';

describe('isAiPreviewId', () => {
  it('recognises preview ids only', () => {
    expect(isAiPreviewId(`${AI_PREVIEW_ID_PREFIX}0`)).toBe(true);
    expect(isAiPreviewId('64f1a2b3c4d5e6f7a8b9c0d1')).toBe(false);
    expect(isAiPreviewId(undefined)).toBe(false);
    expect(isAiPreviewId(null)).toBe(false);
  });
});

describe('withoutPreviewTriple', () => {
  const semantic = (...texts: string[]) => ({ type: 'Linking', content: texts.map((text) => ({ object: { text } })) });
  const texts = (payload: any) => payload.content.map((t: any) => t.object.text);

  it('removes the triple at index, keeping the order, without mutating the payload', () => {
    const payload = semantic('a', 'b', 'c');
    const next = withoutPreviewTriple(payload, 1)!;
    expect(texts(next)).toEqual(['a', 'c']);
    expect(texts(payload)).toEqual(['a', 'b', 'c']);
  });

  it('never removes the last triple', () => {
    expect(withoutPreviewTriple(semantic('a'), 0)).toBeNull();
  });

  it('ignores an index out of range, a missing or non-semantic payload', () => {
    expect(withoutPreviewTriple(semantic('a', 'b'), 2)).toBeNull();
    expect(withoutPreviewTriple(semantic('a', 'b'), -1)).toBeNull();
    expect(withoutPreviewTriple(undefined, 0)).toBeNull();
    expect(withoutPreviewTriple({ type: 'Commenting', content: [1, 2] }, 0)).toBeNull();
  });
});
