/**
 * Enum values for page rendering states (IRenderableView#renderingState)
 * in PDF.js. Taken from web/pdf_rendering_queue.js in the PDF.js library.
 *
 * Reproduced here because this enum is not exported consistently across
 * different versions of PDF.js
 */
export enum RenderingStates {
  INITIAL,
  RUNNING,
  PAUSED,
  FINISHED,
}

/**
 * @typedef PdfTextRange
 * @prop {number} pageIndex
 * @prop {object} anchor
 * @prop {number} anchor.start - Start character offset within the page's text
 * @prop {number} anchor.end - End character offset within the page's text
 */
export type PdfTextRange = {
  pageIndex: number;
  anchor: {
    start: number;
    end: number;
  };
}

/**
 * @typedef PageOffset
 * @prop {number} index - Page index
 * @prop {number} offset - Character offset of start of page within document text
 * @prop {string} text - Text of page
 */
export type PageOffset = {
  index: number;
  offset: number;
  text: string;
}

/**
 * @typedef Match
 * @prop {number} start - Start offset of match in text
 * @prop {number} end - End offset of match in text
 * @prop {number} score -
 *   Score for the match between 0 and 1.0, where 1.0 indicates a perfect match
 *   for the quote and context.
 */
export type Match = {
  start: number;
  end: number;
  score: number;
}
