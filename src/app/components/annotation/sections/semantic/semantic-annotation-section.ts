import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Annotation, SemanticTripleType } from 'src/communication';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ImageDataService } from 'src/app/services/image-data.service';
import { AsyncPipe, DatePipe } from '@angular/common';
import { _t } from '@net7/core';
import { toSubjectRuns } from 'src/app/components/edit-modal/sections/semantic-section/semantic-section.utils';
import { isAiPreviewId } from 'src/app/models/ai-preview';
import { SvgIconComponent } from '../../../svg-icon/svg-icon';

@Component({
    selector: 'pnd-semantic-annotation-section',
    templateUrl: './semantic-annotation-section.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AsyncPipe, DatePipe, SvgIconComponent]
})
export class SemanticAnnotationSectionComponent implements OnInit {
  imageDataService = inject(ImageDataService);

  id = 'semantic';

  @Input() public data$!: Subject<Annotation>;

  @Input() public emit: any;

  @Input() public annotationId!: string;

  public semantic$!: Observable<any>;

  ngOnInit(): void {
    this.semantic$ = this.data$.pipe(map(this.transformData));
  }

  public labels = {
    about: _t('annotation#semantic_subject_about'),
    discardTriple: _t('annotation#discard_triple_title'),
  };

  /** Discard one triple of an AI preview (not saved): the card stays expanded. */
  onDiscardTriple(ev: Event, index: number) {
    ev.stopImmediatePropagation();
    if (!this.emit) return;
    this.emit('click', { id: this.annotationId, source: 'discard-triple', index });
  }

  /**
   * Triples grouped in runs of consecutive triples with the same subject (stored
   * order kept). Only the groups with an element subject have a header.
   * Each triple keeps its index in the annotation content. An AI preview with
   * more than one triple can discard them one by one (never the last one).
   */
  private transformData = (annotation: Annotation): any => {
    if (annotation.type !== 'Linking') return {};
    const triples = annotation.content || [];
    const { runs, indexes } = toSubjectRuns(triples.map(({ subject }) => subject));
    const groups = runs.map((subject) => ({ subject, triples: [] as any[] }));
    triples.forEach((triple, index) => {
      groups[indexes[index]].triples.push(this.transformTriple(triple, index));
    });
    const isPreview = isAiPreviewId(this.annotationId) || isAiPreviewId(annotation.id);
    return { groups, canDiscardTriple: isPreview && triples.length > 1 };
  };

  private transformTriple = (triple: SemanticTripleType, index: number): any => {
    const data = {
      index,
      predicate: this.getPredicate(triple),
      object: this.getObject(triple),
    };
    return data;
  };

  private getPredicate = (triple: SemanticTripleType): any => ({
    label: triple?.predicate?.label,
    uri: triple?.predicate?.uri,
  });

  private getObject = (triple: SemanticTripleType): any => ({
    type: triple.objectType,
    ...triple.object
  });
}
