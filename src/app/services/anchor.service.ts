import { Injectable } from '@angular/core';
import { Annotation } from '@pundit/communication';
import { anchor } from '../models/anchoring/html';
import { SelectorWithType } from '../models/anchoring/types';
import { HighlightElement, highlightRange, removeHighlights } from '../models/highlighter';

@Injectable()
export class AnchorService {
  private annotationHighlights: AnnotationHighlight[] = [];

  async load(rawAnnotations: Annotation[]): Promise<void> {
    rawAnnotations.forEach((annotation) => {
      this.add(annotation);
    });
  }

  async add(annotation: Annotation): Promise<void> {
    if (!this.getHighlightById(annotation.id)) {
      const selectors = this.createSelectors(annotation);
      const range: Range = await anchor(document.body, selectors);
      const highlights = highlightRange(range);
      this.annotationHighlights.push({ highlights, targetId: annotation.id });
      console.warn(this.annotationHighlights);
    }
  }

  remove(annotationId: string) {
    console.warn(`remove ${annotationId}`);
    if (this.getHighlightById(annotationId)) {
      const { highlights } = this.getHighlightById(annotationId);
      console.warn(`highlights ${highlights}`);
      removeHighlights(highlights);
      const index = this.annotationHighlights.findIndex((hl) => hl.targetId === annotationId);
      this.annotationHighlights.splice(index, index + 1);
    }
  }

  removeAll() {
    this.annotationHighlights.map((hl) => hl.targetId).forEach(this.remove);
  }

  getHighlightById(annotationId: string): AnnotationHighlight | null {
    return this.annotationHighlights.find(({ targetId }) => targetId === annotationId) || null;
  }

  private createSelectors(annotation: Annotation): SelectorWithType[] {
    if (!annotation || !annotation.subject?.selected) return [];
    const target = annotation.subject.selected;
    const selectors: SelectorWithType[] = [];
    if (target.rangeSelector) {
      selectors.push({ type: 'RangeSelector', ...target.rangeSelector });
    }
    if (target.textPositionSelector) {
      selectors.push({ type: 'TextPositionSelector', ...target.textPositionSelector });
    }
    if (target.textQuoteSelector) {
      selectors.push({ type: 'TextQuoteSelector', ...target.textQuoteSelector });
    }
    return selectors;
  }
}

export interface AnnotationHighlight {
  targetId: string;
  highlights: HighlightElement[];
}
