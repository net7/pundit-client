import { Component, Input, OnInit } from '@angular/core';
import { Annotation, SemanticTripleType } from '@pundit/communication';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'pnd-semantic-annotation-section',
  templateUrl: './semantic-annotation-section.html',
})
export class SemanticAnnotationSectionComponent implements OnInit {
  id = 'semantic';

  @Input() public data$: Subject<Annotation>;

  public semantic$: Observable<any>;

  ngOnInit(): void {
    this.semantic$ = this.data$.pipe(map(this.transformData));
  }

  private transformData = (annotation: Annotation): any => {
    if (annotation.type !== 'Linking') return {};
    const data = annotation.content?.map(this.transformTriple);
    return { data };
  };

  private transformTriple = (triple: SemanticTripleType): any => {
    const data = {
      predicate: this.getPredicate(triple),
      object: this.getObject(triple),
    };
    return data;
  };

  private getPredicate = (triple: SemanticTripleType): any => ({ label: triple?.predicate?.label });

  private getObject = (triple: SemanticTripleType): any => ({
    type: triple.objectType,
    ...triple.object
  })
}
