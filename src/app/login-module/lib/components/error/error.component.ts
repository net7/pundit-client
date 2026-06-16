import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lib-pundit-login-error',
  templateUrl: './error.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ErrorComponent {
  errorTitle: string;

  errorDescription: string;
}
