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

  update() {
    const bodyTop = document.body.getBoundingClientRect().top;
    const annotations = this.annotationService.getAnnotations().map(
      ({ _meta }) => ({
        created: _meta.created,
        anchor: this.anchorService.getHighlightById(_meta.id)
      })
    );
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const rawElements: NodeListOf<HTMLElement> = shadowRoot.querySelectorAll('n7-annotation');
    const positionMap = [];
    rawElements.forEach((el, index) => {
      const { anchor, created } = annotations[index];
      let anchorPosition = -1;
      if (anchor) {
        const tops = anchor.highlights.map(
          (highlightEl) => highlightEl.getBoundingClientRect().top - bodyTop
        );
        anchorPosition = Math.min(...tops);
      }
      positionMap.push({
        el, anchorPosition, created
      });
    });

    const positions = [];
    positionMap.sort((a, b) => {
      const { created: aCreated, anchorPosition: aAnchorPosition } = a;
      const { created: bCreated, anchorPosition: bAnchorPosition } = b;
      if (aAnchorPosition === bAnchorPosition) {
        return aCreated - bCreated;
      }
      return aAnchorPosition - bAnchorPosition;
    }).forEach((positionData, index) => {
      const { el, anchorPosition } = positionData;
      const { offsetHeight } = el;
      const lastEnd = index ? positions[index - 1].end : TOP_MARGIN;
      const start = anchorPosition < lastEnd
        ? lastEnd
        : anchorPosition;
      const end = start + offsetHeight;
      positions.push({ start, end });

      // update new element position & visibility
      el.style.top = `${start}px`;
      el.style.visibility = 'visible';
    });
  }
}
