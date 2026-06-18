import {
  ChangeDetectorRef, Component, Input, ChangeDetectionStrategy
} from '@angular/core';
import { delay } from 'rxjs/operators';
import { tooltipModel } from 'src/app/models/tooltip-model';
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
  templateUrl: './tooltip.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TooltipComponent {
    @Input() public data: TooltipData;

    @Input() public emit: any;

    constructor(
      private ref: ChangeDetectorRef
    ) {
      // fix update out of pnd-root context
      tooltipModel.changed$.pipe(
        delay(1)
      ).subscribe(() => {
        this.ref.detectChanges();
      });
    }

    onMouseDown(ev: MouseEvent) {
      ev.preventDefault();
    }

    navEmit(type: string, payload: any) {
      if (!this.emit) return;
      this.emit(type, payload);
    }
}
