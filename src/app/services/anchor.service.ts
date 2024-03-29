import { Injectable } from '@angular/core';
import { Annotation } from '@pundit/communication';
import { Subject } from 'rxjs';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { AnchorEvent } from '../event-types';
import { anchor } from '../models/anchoring/html';
import { SelectorWithType } from '../models/anchoring/types';
import { HighlightElement, highlightRange, removeHighlights } from '../models/highlighter';
import { AnnotationService } from './annotation.service';

const HOVER_CLASS = 'is-hovered';

@Injectable()
export class AnchorService {
  private annotationHighlights: AnnotationHighlight[] = [];

  private orphans: Annotation[] = [];

  public events$: Subject<{type: string; payload: any}> = new Subject();

  // fix analytics duplicates
  private analyticsAnchoredIds: string[] = [];

  // fix analytics duplicates
  private analyticsOrphansIds: string[] = [];

  constructor(
    private annotationService: AnnotationService
  ) {}

  async load(rawAnnotations: Annotation[]): Promise<void> {
    rawAnnotations.forEach((annotation) => {
      this.add(annotation);
    });
  }

  async add(annotation: Annotation): Promise<void> {
    if (!this.getHighlightById(annotation.id)) {
      try {
        const selectors = this.createSelectors(annotation);
        const { range, type } = await anchor(document.body, selectors);
        const highlights = highlightRange(range, annotation.serializedBy);
        this.attachEvents(highlights, annotation.id);
        this.annotationHighlights.push({ highlights, targetId: annotation.id });

        // analytics
        if (!this.analyticsAnchoredIds.includes(annotation.id)) {
          this.analyticsAnchoredIds.push(annotation.id);
          AnalyticsModel.track({
            action: AnalyticsAction.AnnotationAnchoringSuccess,
            payload: {
              'anchoring-type': type,
              'annotation-type': annotation.type.toLowerCase()
            }
          });
        }
      } catch (_e) {
        this.orphans.push(annotation);

        // analytics
        if (!this.analyticsOrphansIds.includes(annotation.id)) {
          this.analyticsOrphansIds.push(annotation.id);
          AnalyticsModel.track({
            action: AnalyticsAction.AnnotationAnchoringError,
            payload: {
              'annotation-id': annotation.id
            }
          });
        }
      }
    }
  }

  remove(annotationId: string) {
    if (this.getHighlightById(annotationId)) {
      const { highlights } = this.getHighlightById(annotationId);
      removeHighlights(highlights);
      this.detachEvents(highlights);
      const index = this.annotationHighlights.findIndex((hl) => hl.targetId === annotationId);
      this.annotationHighlights.splice(index, 1);
    }
  }

  removeAll() {
    this.annotationHighlights.map((hl) => hl.targetId).forEach(this.remove.bind(this));
  }

  getHighlightById(annotationId: string): AnnotationHighlight | null {
    return this.annotationHighlights.find(({ targetId }) => targetId === annotationId) || null;
  }

  checkOrphans() {
    const orphans = [...this.orphans];
    // clear
    this.orphans = [];
    // retry
    orphans.forEach((annotation) => {
      this.add(annotation);
    });
  }

  addHoverClass(annotationId) {
    if (this.getHighlightById(annotationId)) {
      const { highlights } = this.getHighlightById(annotationId);
      highlights.forEach((el) => {
        el.classList.add(HOVER_CLASS);
      });
    }
  }

  removeHoverClass(annotationId) {
    if (this.getHighlightById(annotationId)) {
      const { highlights } = this.getHighlightById(annotationId);
      highlights.forEach((el) => {
        el.classList.remove(HOVER_CLASS);
      });
    }
  }

  clear() {
    this.removeAll();
  }

  refresh() {
    // clear
    this.clear();
    // reload
    setTimeout(() => {
      const rawAnnotations = this.annotationService.getRawAnnotations();
      this.load(rawAnnotations);
    });
  }

  private createSelectors(annotation: Annotation): SelectorWithType[] {
    if (!annotation || !annotation.subject?.selected) return [{ start: 0, end: 0, type: 'TextPositionSelector' }];
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

  private attachEvents(highlights: HighlightElement[], annotationId: string) {
    highlights.forEach((el) => {
      el.addEventListener('mouseover', this.onMouseOver.bind(this, annotationId));
      el.addEventListener('mouseleave', this.onMouseLeave.bind(this, annotationId));
      el.addEventListener('click', this.onClick.bind(this, annotationId));
    });
  }

  private detachEvents(highlights: HighlightElement[]) {
    highlights.forEach((el) => {
      el.removeEventListener('mouseover', this.onMouseOver);
      el.removeEventListener('mouseleave', this.onMouseLeave);
      el.removeEventListener('click', this.onClick);
    });
  }

  private onMouseOver(payload) {
    this.addHoverClass(payload);

    // signal
    this.events$.next({
      payload,
      type: AnchorEvent.MouseOver,
    });
  }

  private onMouseLeave(payload) {
    this.removeHoverClass(payload);

    // signal
    this.events$.next({
      payload,
      type: AnchorEvent.MouseLeave,
    });
  }

  private onClick(payload) {
    this.events$.next({
      payload,
      type: AnchorEvent.Click,
    });
  }
}

export interface AnnotationHighlight {
  targetId: string;
  highlights: HighlightElement[];
}
