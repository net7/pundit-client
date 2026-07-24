import { ChangeDetectorRef, Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { delay } from 'rxjs/operators';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { NavData } from '../../types';
import { NgTemplateOutlet } from '@angular/common';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet]
})
export class TooltipComponent {
    private ref = inject(ChangeDetectorRef);

    @Input() public data!: TooltipData;

    @Input() public emit: any;

    constructor() {
      // fix update out of pnd-root context
      tooltipModel.changed$.pipe(
        delay(1)
      ).subscribe(() => {
        this.ref.markForCheck();
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
