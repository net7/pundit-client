import { Injectable } from '@angular/core';
import { Annotation } from '@pundit/communication';
import { anchor } from '../models/anchoring/html';
import { SelectorWithType } from '../models/anchoring/types';
import { HighlightElement, highlightRange } from '../models/highlighter';

@Injectable()
export class AnchorService {
  async load(rawAnnotations: Annotation[]): Promise<HighlightElement[][]> {
    const highlightPromises: Promise<HighlightElement[]>[] = [];
    rawAnnotations.forEach((annotation) => {
      const highlighPromise = this.add(annotation);
      highlightPromises.push(highlighPromise);
    });
    const highlights = await Promise.all(highlightPromises);
    return highlights;
  }

  async add(annotation: Annotation): Promise<HighlightElement[]> {
    const selectors = this.createSelectors(annotation);
    const range: Range = await anchor(document.body, selectors);
    return highlightRange(range);
  }

  async remove(annotation: Annotation): Promise<HighlightElement[]> {
    const selectors = this.createSelectors(annotation);
    const range: Range = await anchor(document.body, selectors);
    return highlightRange(range);
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
