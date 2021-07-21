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

  private transformData = (data: Annotation): any => {
    if (data.type !== 'Linking') return {};
    const triples = data.content?.map(this.transformTriple);
    return { triples };
  };

  private transformTriple = (triple: SemanticTripleType): any => {
    if (!triple) return {};
    const data = {
      predicate: this.getPredicate(triple),
      object: this.getObject(triple),
    };
    return data;
  };

  private getPredicate = (triple: SemanticTripleType): any => ({ label: triple.predicate?.label });

  private getObject = (triple: SemanticTripleType): any => {
    if (triple?.objectType === 'literal') {
      return {
        label: triple?.object?.text,
      };
    // } else if (triple?.objectType === "uri") {
    //   // TODO
    // } else if (triple.objectType === "object") {
    //   // TODO
    }
    return {};
  };
}
