import { Component, Input } from '@angular/core';
import { NavData } from '@n7-frontend/components';

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

    navEmit = (type, payload) => {
      if (!this.emit) return;
      this.emit(type, payload);
    }
}
