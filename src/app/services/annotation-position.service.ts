import { Injectable } from '@angular/core';
import { AnchorService } from './anchor.service';
import { AnnotationService } from './annotation.service';

const TOP_MARGIN = 50;

@Injectable()
export class AnnotationPositionService {
  constructor(
    private annotationService: AnnotationService,
    private anchorService: AnchorService
  ) {}

  /** Recalculate the position and order of each annotation present in the sidebar */
  update() {
    const bodyTop = document.body.getBoundingClientRect().top;
    // get all annotations (creation date and anchor)
    const annotations = this.annotationService.getAnnotations().map(
      ({ _meta }) => ({
        created: _meta.created,
        anchor: this.anchorService.getHighlightById(_meta.id)
      })
    );
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    // get all <n7-annotation> nodes present in the sidebar
    const rawElements: NodeListOf<HTMLElement> = shadowRoot.querySelectorAll('n7-annotation');
    const positionMap = [];
    rawElements.forEach((el, index) => {
      // get the data corresponding to each <n7-annotation>
      const { anchor, created } = annotations[index];
      // default annotation position (as orphan)
      let anchorPosition = -1;
      if (anchor) {
        const tops = anchor.highlights.map(
          // get vertical offset of the corresponding highlight
          (highlightEl) => highlightEl.getBoundingClientRect().top - bodyTop
        );
        // the first highlight
        anchorPosition = Math.min(...tops);
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
      const lastEnd = index ? positions[index - 1].end : TOP_MARGIN;
      const start = anchorPosition < lastEnd
        ? lastEnd
        : anchorPosition;
      const end = start + offsetHeight;
      positions.push({ start, end });

      // update the annotations vertial offset
      el.style.top = `${start}px`;
    });
  }
}
