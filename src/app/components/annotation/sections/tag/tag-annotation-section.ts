import { Component, Input, OnInit } from '@angular/core';
import { Annotation } from '@pundit/communication';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { getTagColor } from 'src/app/helpers/tag-color.helper';

type TagType = { label: string; color: string };

@Component({
  selector: 'pnd-tag-annotation-section',
  templateUrl: './tag-annotation-section.html',
})
export class TagAnnotationSectionComponent implements OnInit {
  id = 'tags';

  @Input() public data$: Subject<Annotation>;

  public tags$: Observable<any>;

  ngOnInit(): void {
    this.tags$ = this.data$.pipe(map(this.transformData));
  }

  private transformData = (data: Annotation): TagType[] => {
    const tags = data?.tags?.map((tag) => ({
      label: tag,
      color: getTagColor(tag),
    }));
    return tags;
  };
}
