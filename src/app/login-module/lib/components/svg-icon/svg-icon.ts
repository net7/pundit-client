import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Interface for SvgIcon's "data"
 */
export interface SvgIconData {
    id: string;
    classes?: string;
}

@Component({
    selector: 'lib-svg-icon',
    templateUrl: './svg-icon.html',
    changeDetection: ChangeDetectionStrategy.Eager
})
export class SvgIconComponent {
    @Input() public data!: SvgIconData;
}
