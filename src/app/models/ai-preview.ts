/** Id prefix of the AI-generated preview annotations, shown before they are saved. */
export const AI_PREVIEW_ID_PREFIX = 'ai-preview-';

/** Whether the annotation id is an AI preview (not saved, no backend id). */
export const isAiPreviewId = (id?: string | null): boolean => !!id?.startsWith(AI_PREVIEW_ID_PREFIX);

/**
 * A semantic preview payload without the triple at `index`, or `null` when it
 * cannot be removed: not a semantic payload, index out of range, or last triple
 * (the whole preview is discarded instead). The content array is never mutated.
 */
export const withoutPreviewTriple = <T extends { type?: string; content?: unknown }>(
  payload: T | undefined,
  index: number,
): T | null => {
  const content = payload?.content;
  if (payload?.type !== 'Linking' || !Array.isArray(content) || content.length <= 1) return null;
  if (!Number.isInteger(index) || index < 0 || index >= content.length) return null;
  return { ...payload, content: content.filter((_triple, i) => i !== index) };
};
