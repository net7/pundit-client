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
  WebPageBuilder
} from '@pundit/communication';
import { describe } from '../anchoring/html';
import {
  getDocumentHref,
  getDocumentTitle
} from './html-util';

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

const highlightAnnotationPayload = (userId: string, notebookId:
  string, selection: Range, root: HTMLElement = document.body): HighlightAnnotation => {
  const annotationBuilder = new HighlightAnnotationBuilder();
  const pageFragment = createWebPageFragment(selection, root);
  annotationBuilder.serializedBy('pundit-client')
    .userId(userId)
    .notebookId(notebookId)
    .subject(pageFragment);
  return annotationBuilder.build();
};
/**
 * Creates a new annotation that is associated with the selected region of
 * the current document.
 */
export function create(
  userId: string,
  notebookId: string,
  selection: Range,
  root: HTMLElement = document.body
) {
  const payload = highlightAnnotationPayload(userId, notebookId, selection, root);
  return annotation.create({ baseUrl: '', data: payload, method: 'post' });
}
