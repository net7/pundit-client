import { Component } from '@angular/core';

@Component({
  selector: 'lib-pundit-login-error',
  templateUrl: './error.component.html',
  standalone: false
})
export class ErrorComponent {
  errorTitle: string;

  errorDescription: string;
}
