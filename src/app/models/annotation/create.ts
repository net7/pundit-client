import { describe } from '../anchoring/html';
import { AnnotationCreateData } from '.';
import { getDocumentHref, getDocumentTitle } from './html-util';

/**
 * Creates a new annotation that is associated with the selected region of
 * the current document.
 */
export function create(selection: Range, root: HTMLElement = document.body): AnnotationCreateData {
  return {
    metadata: {
      href: getDocumentHref(),
      title: getDocumentTitle()
    },
    selector: describe(root, selection)
  };
}
