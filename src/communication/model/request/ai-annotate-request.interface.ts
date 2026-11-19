export type AiAnnotationType = 'highlight' | 'comment' | 'tags' | 'semantic_annotation';

/**
 * A text node of the selection, sent untrimmed (whitespace-only nodes
 * included): the server computes the positions of the response on `text`.
 */
export type AiAnnotateSegment = {
  id: string;
  text: string;
}

/**
 * Context of the page the selection comes from, used by the model only to
 * understand the selection (who it refers to, what the page is about), never
 * annotated. Every field is optional and left out when empty; the server may
 * shorten any of them.
 */
export type AiAnnotateContext = {
  /** `og:title`, else `document.title`. */
  title?: string;
  /** `og:site_name`, else the page host name. */
  site?: string;
  /** `<meta name="description">`, else `og:description`. */
  description?: string;
  /** Page text right before the selection (up to 1,500 characters). */
  before?: string;
  /** Page text right after the selection (up to 1,500 characters). */
  after?: string;
}

export type AiAnnotateRequest = {
  /** Text nodes of the selection in reading order: joined, exactly the selection. */
  segments: AiAnnotateSegment[];
  prompt: string;
  annotation_type: AiAnnotationType;
  /** Page context; absent when there is none. */
  context?: AiAnnotateContext;
}
