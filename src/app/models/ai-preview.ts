/** Id prefix of the AI-generated preview annotations, shown before they are saved. */
export const AI_PREVIEW_ID_PREFIX = 'ai-preview-';

/** Whether the annotation id is an AI preview (not saved, no backend id). */
export const isAiPreviewId = (id?: string | null): boolean => !!id?.startsWith(AI_PREVIEW_ID_PREFIX);
