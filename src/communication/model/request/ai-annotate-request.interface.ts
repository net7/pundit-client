export type AiAnnotationType = 'highlight' | 'comment' | 'tags' | 'semantic_annotation';

/**
 * A text chunk of the selected range, identified so that the LLM
 * response can be mapped back to the DOM.
 */
export type AiAnnotateChunk = {
  id: string;
  text: string;
}

export type AiAnnotateRequest = {
  chunks: AiAnnotateChunk[];
  prompt: string;
  annotation_type: AiAnnotationType;
  selected_text?: string | null;
}
