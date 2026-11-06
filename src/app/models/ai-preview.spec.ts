import { AI_PREVIEW_ID_PREFIX, isAiPreviewId } from './ai-preview';

describe('isAiPreviewId', () => {
  it('recognises preview ids only', () => {
    expect(isAiPreviewId(`${AI_PREVIEW_ID_PREFIX}0`)).toBe(true);
    expect(isAiPreviewId('64f1a2b3c4d5e6f7a8b9c0d1')).toBe(false);
    expect(isAiPreviewId(undefined)).toBe(false);
    expect(isAiPreviewId(null)).toBe(false);
  });
});
