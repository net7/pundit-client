import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { ModalComponent } from '../components/modal/modal.component';

@Component({
    selector: 'lib-pundit-login',
    templateUrl: './pundit-login.component.html',
    styleUrls: ['./pundit-login.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ModalComponent]
})
export class PunditLoginComponent {}
