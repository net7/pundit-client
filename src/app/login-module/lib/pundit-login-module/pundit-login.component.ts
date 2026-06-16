import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lib-pundit-login',
  templateUrl: './pundit-login.component.html',
  styleUrls: ['./pundit-login.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PunditLoginComponent {}
