import {
  HighlightAnnotation,
  HighlightAnnotationBuilder,
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
  CommentAnnotationBuilder,
} from '@pundit/communication';
import { DocumentInfoPdf } from 'src/app/services/document-info/document-info-pdf.service';
import { DocumentInfoWebpage } from 'src/app/services/document-info/document-info-webpage.service';
import { describe } from '../anchoring/html';
import { _c } from '../config';
// import {
//   getDocumentHref,
//   getDocumentTitle
// } from './html-util';

type AnnotationPayload = {
  userId: string;
  notebookId: string;
  selection: Range;
  type: AnnotationType;
  documentInfo: DocumentInfoWebpage | DocumentInfoPdf;
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
const createWebPageFragment = (
  selection: Range,
  documentInfo: DocumentInfoWebpage | DocumentInfoPdf,
  root: HTMLElement = document.body
): WebPage => {
  const pageBuilder = new WebPageBuilder();
  console.log('todo: add annotation metadata----------------------------->', documentInfo);
  const { pageTitle, pageContext } = documentInfo;
  // pageBuilder.pageContext(getDocumentHref()).pageTitle(getDocumentTitle());
  pageBuilder.pageContext(pageContext).pageTitle(pageTitle);
  if (selection) {
    const selectors = describe(root, selection);
    const rangeSelector = createRangeSelector(selectors);
    const textPositionSelctor = createTextPositionSelector(selectors);
    const textQuoteSelector = createTextQuoteSelector(selectors);
    pageBuilder.selected(
      textQuoteSelector.exact,
      rangeSelector,
      textPositionSelctor,
      textQuoteSelector
    );
  }
  const page = pageBuilder.build();
  return page;
};
const highlightAnnotationPayload = ({
  userId,
  notebookId,
  selection,
  documentInfo,
  root = document.body
}: AnnotationPayload): HighlightAnnotation => {
  const serializer = _c('serializer');
  const annotationBuilder = new HighlightAnnotationBuilder();
  const pageFragment = createWebPageFragment(selection, documentInfo, root);
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
  documentInfo,
  root = document.body
}: AnnotationPayload): CommentAnnotation => {
  const serializer = _c('serializer');
  const annotationBuilder = new CommentAnnotationBuilder();
  const pageFragment = createWebPageFragment(selection, documentInfo, root);
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

export function createRequestPayload(payload: AnnotationPayload) {
  return annotationPayload(payload);
}
