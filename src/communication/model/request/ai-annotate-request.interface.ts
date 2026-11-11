export type AiAnnotationType = 'highlight' | 'comment' | 'tags' | 'semantic_annotation';

/**
 * A text node of the selection, sent untrimmed (whitespace-only nodes
 * included): the server computes the positions of the response on `text`.
 */
export type AiAnnotateSegment = {
  id: string;
  text: string;
}

export type AiAnnotateRequest = {
  /** Text nodes of the selection in reading order: joined, exactly the selection. */
  segments: AiAnnotateSegment[];
  prompt: string;
  annotation_type: AiAnnotationType;
}
