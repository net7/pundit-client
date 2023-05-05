import { Injectable } from '@angular/core';
import { AnchorService } from './anchor.service';
import { AnnotationService } from './annotation.service';
import { PdfService } from './pdf.service';

const TOP_MARGIN = 60;
const TOP_MARGIN_FULLPAGE = 110;

@Injectable()
export class AnnotationPositionService {
  constructor(
    private annotationService: AnnotationService,
    private anchorService: AnchorService,
    private pdfService: PdfService
  ) {}

  /** Recalculate the position and order of each annotation present in the sidebar */
  update() {
    const rootElement = document.getElementsByTagName('pnd-root')[0];
    // fix cleared pnd-root
    if (!rootElement) {
      return;
    }

    const { shadowRoot } = rootElement;
    let containerTop = document.body.getBoundingClientRect().top;
    // pdf document check
    if (this.pdfService.isActive()) {
      const pdfDocumentContainer = this.pdfService.getDocumentContainer();
      if (pdfDocumentContainer) {
        const viewerTop = pdfDocumentContainer.getBoundingClientRect().top;
        const viewerToolbarHeight = this.pdfService.getViewerToolbarHeight();
        containerTop = viewerTop - viewerToolbarHeight;
      }
    }
    // get all annotations (creation date and anchor)
    const showFullPage = this.annotationService.showPageAnnotations$.getValue();
    const annotations = this.annotationService.getAnnotationsToShow().map(
      ({ data$, id }) => ({
        created: data$.getValue().created,
        anchor: this.anchorService.getHighlightById(id)
      })
    );
    // get all <n7-annotation> nodes present in the sidebar
    const rawElements: NodeListOf<HTMLElement> = shadowRoot.querySelectorAll('annotation');
    const positionMap = [];
    rawElements.forEach((el, index) => {
      // get the data corresponding to each <n7-annotation>
      const { anchor, created } = annotations[index];
      // default annotation position (as orphan)
      let anchorPosition = -1;
      if (anchor) {
        const tops = anchor.highlights
          .filter((highlightEl) => highlightEl.offsetHeight > 0)
          .map(
            // get vertical offset of the corresponding highlight
            (highlightEl) => highlightEl.getBoundingClientRect().top - containerTop
          );
        if (tops.length) {
          // the first highlight
          anchorPosition = Math.min(...tops);
        }
      }
      // map the highlight to the corresponding annotation
      positionMap.push({
        el, anchorPosition, created
      });
    });

    const positions = [];
    positionMap.sort((a, b) => {
      // sort the mapped hightlights/annotations by position & creation-date
      const { created: aCreated, anchorPosition: aAnchorPosition } = a;
      const { created: bCreated, anchorPosition: bAnchorPosition } = b;
      if (aAnchorPosition === bAnchorPosition) {
        return aCreated - bCreated;
      }
      return aAnchorPosition - bAnchorPosition;
    }).forEach((positionData, index) => {
      // calculate the correct offset of the annotation based on the mapped highlight position
      // or the previous annotation offset (lastEnd)
      const { el, anchorPosition } = positionData;
      const { offsetHeight } = el;
      const firstMargin = showFullPage ? TOP_MARGIN_FULLPAGE : TOP_MARGIN;
      const lastEnd = index ? positions[index - 1].end : firstMargin;
      const start = anchorPosition < lastEnd
        ? lastEnd
        : anchorPosition;
      const end = start + offsetHeight;
      positions.push({ start, end });

      // update the annotations vertical offset & visibility
      el.style.top = `${start}px`;
      el.style.visibility = 'visible';
    });
  }
}
