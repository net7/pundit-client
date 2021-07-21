import { Component, Input, OnInit } from '@angular/core';
import { Annotation } from '@pundit/communication';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'pnd-comment-annotation-section',
  templateUrl: './comment-annotation-section.html',
})
export class CommentAnnotationSectionComponent implements OnInit {
  id = 'comment';

  @Input() public data$: Subject<Annotation>;

  public comment$: Observable<any>;

  ngOnInit(): void {
    this.comment$ = this.data$.pipe(map(this.transformData));
  }

  private transformData = (data: Annotation): string => {
    if (data.type !== 'Commenting') return null;
    return data?.content?.comment;
  };
}
