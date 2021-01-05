import { Injectable } from '@angular/core';
import { AnchorService } from './anchor.service';
import { AnnotationService } from './annotation.service';

const ELEMENT_MARGIN = 0;

@Injectable()
export class AnnotationPositionService {
  constructor(
    private annotationService: AnnotationService,
    private anchorService: AnchorService
  ) {}

  update() {
    const bodyTop = document.body.getBoundingClientRect().top;
    const highlights = this.annotationService.getAnnotations().map(
      ({ _meta }) => this.anchorService.getHighlightById(_meta.id)
    );
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const rawElements: NodeListOf<HTMLElement> = shadowRoot.querySelectorAll('n7-annotation');
    const positions = [];
    rawElements.forEach((el, index) => {
      const currentHighlights = highlights[index];
      let startPosition = 0;
      if (currentHighlights) {
        const tops = currentHighlights.highlights.map(
          (highlightEl) => highlightEl.getBoundingClientRect().top - bodyTop
        );
        startPosition = Math.min(...tops);
      }
      const { offsetHeight } = el;
      const lastEnd = index ? positions[index - 1].end : 0;
      const start = startPosition < lastEnd ? lastEnd + ELEMENT_MARGIN : startPosition;
      const end = start + offsetHeight;
      positions.push({ start, end });

      // update new element position & visibility
      el.style.top = `${start}px`;
      el.style.visibility = 'visible';
    });
  }
}
