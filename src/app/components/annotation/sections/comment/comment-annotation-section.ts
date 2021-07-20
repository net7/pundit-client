import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'pnd-comment-annotation-section',
  templateUrl: './comment-annotation-section.html'
})
export class CommentAnnotationSectionComponent {
    id = 'comment';

    @Input() public update$: Subject<void>;

    @Input() public data: Subject<void>;

    private destroy$: Subject<void> = new Subject();

    ngAfterViewInit() {
      this.update$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(this.onUpdate);
    }

    ngOnDestroy() {
      this.destroy$.next();
    }

    private onUpdate = () => {
      console.log('update');
    }
}
