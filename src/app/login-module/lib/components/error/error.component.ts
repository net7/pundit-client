import { Component } from '@angular/core';

@Component({
  selector: 'lib-pundit-login-error',
  templateUrl: './error.component.html',
})
export class ErrorComponent {
  errorTitle: string;

  errorDescription: string;
}
