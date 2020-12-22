import {
  HighlightAnnotation,
  HighlightAnnotationBuilder,
  annotation,
  RangeSelector,
  RangeSelectorBuilder,
  TextPositionSelector,
  TextPositionSelectorBuilder,
  TextQuoteSelector,
  TextQuoteSelectorBuilder,
  WebPage,
  WebPageBuilder,
  AnnotationType,
  SemanticTripleType,
  CommentAnnotation,
  CommentAnnotationBuilder
} from '@pundit/communication';
import { describe } from '../anchoring/html';
import { _c } from '../config';
import {
  getDocumentHref,
  getDocumentTitle
} from './html-util';

const baseUrl = _c('baseUrl');
const serializer = _c('serializer');

type AnnotationPayload = {
  userId: string;
  notebookId: string;
  selection: Range;
  type: AnnotationType;
  root?: HTMLElement;
  options: {
    content?: {
      comment: string;
    } | SemanticTripleType[];
  };
};

const createRangeSelector = (selectors: any): RangeSelector => {
  if (!selectors || !Array.isArray(selectors)) return undefined;
  const value = selectors.find((selector) => selector.type === 'RangeSelector');
  if (!value) return undefined;
  const builder = new RangeSelectorBuilder();
  const selector = builder.startContainer(value.startContainer)
    .startOffset(value.startOffset)
    .endContainer(value.endContainer)
    .endOffset(value.endOffset)
    .build();
  return selector;
};
const createTextQuoteSelector = (selectors: any): TextQuoteSelector => {
  if (!selectors || !Array.isArray(selectors)) return undefined;
  const value = selectors.find((selector) => selector.type === 'TextQuoteSelector');
  if (!value) return undefined;
  const builder = new TextQuoteSelectorBuilder();
  const selector = builder.exact(value.exact)
    .prefix(value.prefix)
    .suffix(value.suffix)
    .build();
  return selector;
};
const createTextPositionSelector = (selectors: any): TextPositionSelector => {
  if (!selectors || !Array.isArray(selectors)) return undefined;
  const value = selectors.find((selector) => selector.type === 'TextPositionSelector');
  if (!value) return undefined;
  const builder = new TextPositionSelectorBuilder();
  const selector = builder.end(value.end)
    .start(value.start)
    .build();
  return selector;
};
const createWebPageFragment = (selection: Range, root: HTMLElement = document.body): WebPage => {
  const selectors = describe(root, selection);
  const rangeSelector = createRangeSelector(selectors);
  const textPositionSelctor = createTextPositionSelector(selectors);
  const textQuoteSelector = createTextQuoteSelector(selectors);
  const pageBuilder = new WebPageBuilder();
  pageBuilder.pageContext(getDocumentHref())
    .pageTitle(getDocumentTitle())
    .selected(textQuoteSelector.exact, rangeSelector, textPositionSelctor, textQuoteSelector);
  const page = pageBuilder.build();
  return page;
};
const highlightAnnotationPayload = ({
  userId,
  notebookId,
  selection,
  root = document.body
}: AnnotationPayload): HighlightAnnotation => {
  const annotationBuilder = new HighlightAnnotationBuilder();
  const pageFragment = createWebPageFragment(selection, root);
  annotationBuilder.serializedBy(serializer)
    .userId(userId)
    .notebookId(notebookId)
    .subject(pageFragment);
  return annotationBuilder.build();
};
const commentAnnotationPayload = ({
  userId,
  notebookId,
  selection,
  options,
  root = document.body
}: AnnotationPayload): CommentAnnotation => {
  const annotationBuilder = new CommentAnnotationBuilder();
  const pageFragment = createWebPageFragment(selection, root);
  let comment = '';
  if (options.content) {
    comment = (options.content as {
      comment: string;
    }).comment;
  }
  annotationBuilder.serializedBy(serializer)
    .userId(userId)
    .notebookId(notebookId)
    .comment(comment)
    .subject(pageFragment);

  console.warn('TODO: aggiungere comment a payload', options);
  return annotationBuilder.build();
};
const annotationPayload = (
  payload: AnnotationPayload
): HighlightAnnotation | CommentAnnotation => (payload.type === 'Commenting'
  ? commentAnnotationPayload(payload)
  : highlightAnnotationPayload(payload));
/**
 * Creates a new annotation that is associated with the selected region of
 * the current document.
 */
export function create(payload: AnnotationPayload) {
  const requestPayload = annotationPayload(payload);
  return annotation.create({ baseUrl, data: requestPayload });
}
