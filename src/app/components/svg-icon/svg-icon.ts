import { Component, Input } from '@angular/core';

/**
 * Interface for SvgIcon's "data"
 */
export interface SvgIconData {
    id: string;
    classes?: string;
}

@Component({
  selector: 'pnd-svg-icon',
  templateUrl: './svg-icon.html'
})
export class SvgIconComponent {
    @Input() public data: SvgIconData;
}
