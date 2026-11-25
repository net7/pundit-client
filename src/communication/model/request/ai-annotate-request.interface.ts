export type AiAnnotationType = 'highlight' | 'comment' | 'tags' | 'semantic_annotation';

/**
 * What the request annotates: the selection (its `segments`) or the whole page
 * (its `context`). A request on a selection leaves it out.
 */
export type AiAnnotateSubject = 'selection' | 'page';

/**
 * A text node of the selection, sent untrimmed (whitespace-only nodes
 * included): the server computes the positions of the response on `text`.
 */
export type AiAnnotateSegment = {
  id: string;
  text: string;
}

/**
 * Context of the page. In a request on a selection it is used by the model
 * only to understand the selection (who it refers to, what the page is about),
 * never annotated; in a request on the page it is what is annotated.
 * Every field is optional and left out when empty; the server may shorten any
 * of them.
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
  /**
   * Beginning of the page text (up to 6,000 characters); only in a request on
   * the page, which carries no `before` / `after`.
   */
  text?: string;
}

export type AiAnnotateRequest = {
  /** `page` in a request on the whole page; absent: the selection. */
  subject?: AiAnnotateSubject;
  /**
   * Text nodes of the selection in reading order: joined, exactly the
   * selection. Absent in a request on the page.
   */
  segments?: AiAnnotateSegment[];
  prompt: string;
  annotation_type: AiAnnotationType;
  /** Page context; absent when there is none. */
  context?: AiAnnotateContext;
}
