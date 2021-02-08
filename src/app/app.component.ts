import { ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'pnd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class AppComponent {
  title = 'angular-test';

  constructor(private changeDetectorRef: ChangeDetectorRef) {}
}
