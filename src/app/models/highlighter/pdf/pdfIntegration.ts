// FIXME: adattare a logica pundit

import debounce from 'lodash';
import { AnnotationData } from 'src/app/components/annotation/annotation';
import { PDFViewerApplication, RenderingStates } from '../../anchoring/pdf/types';
import { PDFMetadata } from './pdfMetadata';
import { ListenerCollection } from './listener-collection';
import { anchor as pdfAnchor } from '../../anchoring/pdf/anchor';
import { describe as pdfDescribe } from '../../anchoring/pdf/describe';
import { documentHasText } from '../../anchoring/pdf/documentHasText';
import { Anchor, SelectorWithType } from '../../anchoring/types';
import { createShadowRoot } from './shadow-root';
import { removePlaceholder } from '../../anchoring/pdf/placeholder';
import { anchorIsInPlaceholder } from './anchorIsInPlaceholder';
import { offsetRelativeTo, scrollElement } from './scroll';
import { delay } from './delay';

// The viewport and controls for PDF.js start breaking down below about 670px
// of available space, so only render PDF and sidebar side-by-side if there
// is enough room. Otherwise, allow sidebar to overlap PDF
const MIN_PDF_WIDTH = 680;

/**
 * Integration that works with PDF.js
 * @implements {Integration}
 */
export class PDFIntegration {
  public annotator;

  public pdfViewer;

  public pdfContainer;

  public pdfMetadata: PDFMetadata;

  public observer: MutationObserver;

  private _reanchoringMaxWait: number;

  private _warningBanner: HTMLElement;

  private _updateAnnotationLayerVisibility;

  private _listeners: ListenerCollection;

  private _destroyed: boolean;

  /**
   * @param {Annotator} annotator
   * @param {object} options
   *   @param {number} [options.reanchoringMaxWait] - Max time to wait for
   *     re-anchoring to complete when scrolling to an un-rendered page.
   */
  constructor(annotator, options: { reanchoringMaxWait?: number } = {}) {
    this.annotator = annotator;

    const window_ = /** @type {HypothesisWindow} */ (window);

    // Assume this class is only used if we're in the PDF.js viewer.
    const pdfViewerApp: PDFViewerApplication = (window_ as any).PDFViewerApplication;

    this.pdfViewer = pdfViewerApp.pdfViewer;
    this.pdfViewer.viewer.classList.add('has-transparent-text-layer');

    // Get the element that contains all of the PDF.js UI. This is typically
    // `document.body`.
    this.pdfContainer = pdfViewerApp.appConfig?.appContainer ?? document.body;

    this.pdfMetadata = new PDFMetadata(pdfViewerApp);

    this.observer = new MutationObserver(
      debounce(() => this._update()) as unknown as MutationCallback
    );
    this.observer.observe(this.pdfViewer.viewer, {
      attributes: true,
      attributeFilter: ['data-loaded'],
      childList: true,
      subtree: true,
    });

    /**
     * Amount of time to wait for re-anchoring to complete when scrolling to
     * an anchor in a not-yet-rendered page.
     */
    this._reanchoringMaxWait = options.reanchoringMaxWait ?? 3000;

    /**
     * A banner shown at the top of the PDF viewer warning the user if the PDF
     * is not suitable for use with Hypothesis.
     *
     * @type {HTMLElement|null}
     */
    this._warningBanner = null;
    this._checkForSelectableText();

    // Hide annotation layer when the user is making a selection. The annotation
    // layer appears above the invisible text layer and can interfere with text
    // selection. See https://github.com/hypothesis/client/issues/1464.
    this._updateAnnotationLayerVisibility = () => {
      const selection = /** @type {Selection} */ (window_.getSelection());

      // Add CSS class to indicate whether there is a selection. Annotation
      // layers are then hidden by a CSS rule in `pdfjs-overrides.scss`.
      this.pdfViewer.viewer.classList.toggle(
        'is-selecting',
        !selection.isCollapsed
      );
    };

    this._listeners = new ListenerCollection();
    this._listeners.add(
      document,
      'selectionchange',
      this._updateAnnotationLayerVisibility
    );

    // A flag that indicates whether `destroy` has been called. Used to handle
    // `destroy` being called during async code elsewhere in the class.
    this._destroyed = false;
  }

  destroy() {
    this._listeners.removeAll();
    this.pdfViewer.viewer.classList.remove('has-transparent-text-layer');
    this.observer.disconnect();
    this._destroyed = true;
  }

  /**
   * Return the URL of the currently loaded PDF document.
   */
  uri() {
    return this.pdfMetadata.getUri();
  }

  /**
   * Return the metadata (eg. title) for the currently loaded PDF document.
   */
  getMetadata() {
    return this.pdfMetadata.getMetadata();
  }

  /**
   * Resolve serialized `selectors` from an annotation to a range.
   *
   * @param {HTMLElement} root
   * @param {Selector[]} selectors
   * @return {Promise<Range>}
   */
  anchor(root: HTMLElement, selectors: SelectorWithType[]) {
    // nb. The `root` argument is not really used by `anchor`. It existed for
    // consistency between HTML and PDF anchoring and could be removed.
    return pdfAnchor(root, selectors);
  }

  /**
   * Generate selectors for the text in `range`.
   *
   * @param {HTMLElement} root
   * @param {Range} range
   * @return {Promise<Selector[]>}
   */
  describe(root: HTMLElement, range: Range) {
    // nb. The `root` argument is not really used by `anchor`. It existed for
    // consistency between HTML and PDF anchoring and could be removed.
    return pdfDescribe(root, range);
  }

  /**
   * Check whether the PDF has selectable text and show a warning if not.
   */
  async _checkForSelectableText() {
    // Wait for PDF to load.
    try {
      await this.uri();
    } catch (e) {
      return;
    }

    // Handle `PDF` instance being destroyed while URI is fetched. This is only
    // expected to happen in synchronous tests.
    if (this._destroyed) {
      return;
    }

    try {
      const hasText = await documentHasText();
      this._toggleNoSelectableTextWarning(!hasText);
    } catch (err) {
      /* istanbul ignore next */
      console.warn('Unable to check for text in PDF:', err);
    }
  }

  /**
   * Set whether the warning about a PDF's suitability for use with Hypothesis
   * is shown.
   *
   * @param {boolean} showWarning
   */
  _toggleNoSelectableTextWarning(showWarning) {
    // Get a reference to the top-level DOM element associated with the PDF.js
    // viewer.
    const outerContainer: HTMLElement = document.querySelector('#outerContainer');

    if (!showWarning) {
      if ('remove' in this._warningBanner) {
        this._warningBanner.remove();
      }
      this._warningBanner = null;

      // Undo inline styles applied when the banner is shown. The banner will
      // then gets its normal 100% height set by PDF.js's CSS.
      outerContainer.style.height = '';

      return;
    }

    this._warningBanner = document.createElement('hypothesis-banner');
    document.body.prepend(this._warningBanner);

    const warningBannerContent = createShadowRoot(this._warningBanner);
    // render(<WarningBanner />, warningBannerContent);
    console.warn('FIXME: warning banner', this._warningBanner, warningBannerContent);

    const bannerHeight = this._warningBanner.getBoundingClientRect().height;

    // The `#outerContainer` element normally has height set to 100% of the body.
    //
    // Reduce this by the height of the banner so that it doesn't extend beyond
    // the bottom of the viewport.
    //
    // We don't currently handle the height of the banner changing here.
    outerContainer.style.height = `calc(100% - ${bannerHeight}px)`;
  }

  // This method (re-)anchors annotations when pages are rendered and destroyed.
  _update() {
    // A list of annotations that need to be refreshed.
    const refreshAnnotations = [];

    const pageCount = this.pdfViewer.pagesCount;
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const page = this.pdfViewer.getPageView(pageIndex);
      if (!page?.textLayer?.renderingDone) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // Detect what needs to be done by checking the rendering state.
      switch (page.renderingState) {
        case RenderingStates.INITIAL:
          // This page has been reset to its initial state so its text layer
          // is no longer valid. Null it out so that we don't process it again.
          page.textLayer = null;
          break;
        case RenderingStates.FINISHED:
          // This page is still rendered. If it has a placeholder node that
          // means the PDF anchoring module anchored annotations before it was
          // rendered. Remove this, which will cause the annotations to anchor
          // again, below.
          removePlaceholder(page.div);
          break;
        default:
          break;
      }
    }

    // Find all the anchors that have been invalidated by page state changes.
    // eslint-disable-next-line no-restricted-syntax
    for (const anchor of this.annotator.anchors) {
      // Skip any we already know about.
      if (anchor.highlights) {
        if (refreshAnnotations.includes(anchor.annotation)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // If the highlights are no longer in the document it means that either
        // the page was destroyed by PDF.js or the placeholder was removed above.
        // The annotations for these anchors need to be refreshed.
        for (let index = 0; index < anchor.highlights.length; index += 1) {
          const hl = anchor.highlights[index];
          if (!document.body.contains(hl)) {
            anchor.highlights.splice(index, 1);
            delete anchor.range;
            refreshAnnotations.push(anchor.annotation);
            break;
          }
        }
      }
    }

    refreshAnnotations.map((annotation) => this.annotator.anchor(annotation));
  }

  /**
   * Return the scrollable element which contains the document content.
   *
   * @return {HTMLElement}
   */
  contentContainer(): HTMLElement {
    return document.querySelector('#viewerContainer');
  }

  /**
   * Attempt to make the PDF viewer and the sidebar fit side-by-side without
   * overlap if there is enough room in the viewport to do so reasonably.
   * Resize the PDF viewer container element to leave the right amount of room
   * for the sidebar, and prompt PDF.js to re-render the PDF pages to scale
   * within that resized container.
   *
   * @param {SidebarLayout} sidebarLayout
   * @return {boolean} - True if side-by-side mode was activated
   */
  fitSideBySide(sidebarLayout) {
    const maximumWidthToFit = window.innerWidth - sidebarLayout.width;
    const active = sidebarLayout.expanded && maximumWidthToFit >= MIN_PDF_WIDTH;

    // If the sidebar is closed, we reserve enough space for the toolbar controls
    // so that they don't overlap a) the chevron-menu on the right side of
    // PDF.js's top toolbar and b) the document's scrollbar.
    //
    // If the sidebar is open, we reserve space for the whole sidebar if there is
    // room, otherwise we reserve the same space as in the closed state to
    // prevent the PDF content shifting when opening and closing the sidebar.
    const reservedSpace = active
      ? sidebarLayout.width
      : sidebarLayout.toolbarWidth;
    this.pdfContainer.style.width = `calc(100% - ${reservedSpace}px)`;

    // The following logic is pulled from PDF.js `webViewerResize`
    const { currentScaleValue } = this.pdfViewer;
    if (
      currentScaleValue === 'auto'
      || currentScaleValue === 'page-fit'
      || currentScaleValue === 'page-width'
    ) {
      // NB: There is logic within the setter for `currentScaleValue`
      // Setting this scale value will prompt PDF.js to recalculate viewport
      this.pdfViewer.currentScaleValue = currentScaleValue;
    }
    // This will cause PDF pages to re-render if their scaling has changed
    this.pdfViewer.update();

    return active;
  }

  /**
   * Scroll to the location of an anchor in the PDF.
   *
   * If the anchor refers to a location that is an un-rendered page far from
   * the viewport, then scrolling happens in three phases. First the document
   * scrolls to the approximate location indicated by the placeholder anchor,
   * then `scrollToAnchor` waits until the page's text layer is rendered and
   * the annotation is re-anchored in the fully rendered page. Then it scrolls
   * again to the final location.
   *
   * @param {Anchor} anchor
   */
  async scrollToAnchor(anchor) {
    const { annotation } = anchor;
    const inPlaceholder = anchorIsInPlaceholder(anchor);
    const offset = this._anchorOffset(anchor);
    if (offset === null) {
      return;
    }

    // nb. We only compute the scroll offset once at the start of scrolling.
    // This is important as the highlight may be removed from the document during
    // the scroll due to a page transitioning from rendered <-> un-rendered.
    await scrollElement(this.contentContainer(), offset);

    if (inPlaceholder) {
      const foundAnchor = await this._waitForAnnotationToBeAnchored(
        annotation,
        this._reanchoringMaxWait
      );
      if (!foundAnchor) {
        return;
      }
      const foundAnchorOffset = this._anchorOffset(foundAnchor);
      if (foundAnchorOffset === null) {
        return;
      }
      await scrollElement(this.contentContainer(), foundAnchorOffset);
    }
  }

  /**
   * Wait for an annotation to be anchored in a rendered page.
   *
   * @param {AnnotationData} annotation
   * @param {number} maxWait
   * @return {Promise<Anchor|null>}
   */
  async _waitForAnnotationToBeAnchored(
    annotation: AnnotationData, maxWait: number
  ): Promise<Anchor> {
    const start = Date.now();
    let anchor;
    do {
      // nb. Re-anchoring might result in a different anchor object for the
      // same annotation.
      anchor = this.annotator.anchors.find((a) => a.annotation === annotation);
      if (!anchor || anchorIsInPlaceholder(anchor)) {
        anchor = null;

        // If no anchor was found, wait a bit longer and check again to see if
        // re-anchoring completed.
        // eslint-disable-next-line no-await-in-loop
        await delay(20);
      }
    } while (!anchor && Date.now() - start < maxWait);
    return anchor ?? null;
  }

  /**
   * Return the offset that the PDF content container would need to be scrolled
   * to, in order to make an anchor visible.
   *
   * @param {Anchor} anchor
   * @return {number|null} - Target offset or `null` if this anchor was not resolved
   */
  _anchorOffset(anchor) {
    if (!anchor.highlights) {
      // This anchor was not resolved to a location in the document.
      return null;
    }
    const highlight = anchor.highlights[0];
    return offsetRelativeTo(highlight, this.contentContainer());
  }
}
