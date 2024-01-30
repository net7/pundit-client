import { Component, Input, OnInit } from '@angular/core';
import { _t } from '@net7/core';
import { Annotation } from '@pundit/communication';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'pnd-highlight-annotation-section',
  templateUrl: './highlight-annotation-section.html',
})
export class HighlightAnnotationSectionComponent implements OnInit {
  id = 'highlight';

  @Input() public data$: Subject<Annotation>;

  @Input() public serializedBy: string;

  public classHypo = '';

  public highlight$: Observable<any>;

  ngOnInit(): void {
    this.highlight$ = this.data$.pipe(map(this.transformData));
    if (this.serializedBy === 'hypothesis') {
      this.classHypo = ' hypo';
    }
  }

  private transformData = (annotation: Annotation): any => {
    const { subject } = annotation;
    const isFullpage = !subject?.selected;
    let text;
    let date;
    if (isFullpage) {
      text = _t('fullpage#label');
      date = annotation.created;
    } else {
      text = subject?.selected?.text;
    }
    return { text, isFullpage, date };
  };
}
