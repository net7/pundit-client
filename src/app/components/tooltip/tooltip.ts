import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { NavData } from '@n7-frontend/components';
import { debounceTime } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { selectionHandler } from 'src/app/models/selection/selection-handler';

/**
 * Interface for TooltipComponent's "data"
 */
export interface TooltipData {
    navData: NavData;
    visible: boolean;
}

@Component({
  selector: 'pnd-tooltip',
  templateUrl: './tooltip.html'
})
export class TooltipComponent {
    @Input() public data: TooltipData;

    @Input() public emit: any;

    constructor(
      private ref: ChangeDetectorRef
    ) {
      // fix update out of pnd-root context
      selectionHandler.changed$
        .pipe(
          debounceTime(_c('tooltipDelay') + 1)
        ).subscribe(() => {
          this.ref.detectChanges();
        });
    }

    onMouseDown(ev: MouseEvent) {
      ev.preventDefault();
    }

    navEmit = (type, payload) => {
      if (!this.emit) return;
      this.emit(type, payload);
    }
}
