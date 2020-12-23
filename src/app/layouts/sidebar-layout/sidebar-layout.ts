import {
  Component, OnInit, OnDestroy, Input
} from '@angular/core';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { ReplaySubject } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayoutEvent } from 'src/app/types';
import { _c } from 'src/app/models/config';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SidebarLayoutConfig as config } from './sidebar-layout.config';

@Component({
  selector: 'sidebar-layout',
  templateUrl: './sidebar-layout.html'
})
export class SidebarLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  @Input() layoutEvent$: ReplaySubject<LayoutEvent>;

  public logo: SafeResourceUrl;

  constructor(
    private annotationService: AnnotationService,
    private sanitizer: DomSanitizer
  ) {
    super(config);

    this.logo = this.sanitizer.bypassSecurityTrustResourceUrl(`${_c('chromeExtUrl')}/assets/mocks/pundit-icon-48-light.png`);
  }

  protected initPayload() {
    return {
      layoutEvent$: this.layoutEvent$,
      annotationService: this.annotationService
    };
  }

  ngOnInit() {
    this.onInit();
  }

  ngOnDestroy() {
    this.onDestroy();
  }
}
