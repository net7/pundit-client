import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { delay } from 'rxjs/operators';
import tooltipHandler from 'src/app/models/tooltip-handler';
import { NavData } from '../../types';

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
      tooltipHandler.changed$.pipe(
        delay(1)
      ).subscribe(() => {
        this.ref.detectChanges();
      });
    }

    onMouseDown(ev: MouseEvent) {
      ev.preventDefault();
    }

    navEmit(type, payload) {
      if (!this.emit) return;
      this.emit(type, payload);
    }
}
