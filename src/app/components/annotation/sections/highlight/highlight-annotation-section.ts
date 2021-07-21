import { Component, Input, OnInit } from '@angular/core';
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

  public highlight$: Observable<any>;

  ngOnInit(): void {
    this.highlight$ = this.data$.pipe(map(this.transformData));
  }

  private transformData = (data: Annotation): string => {
    const { text } = data?.subject?.selected;
    return text;
  };
}
