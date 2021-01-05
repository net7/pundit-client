import {
  Component, OnInit, OnDestroy, Input, ChangeDetectorRef
} from '@angular/core';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { ReplaySubject } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnnotationPositionService } from 'src/app/services/annotation-position.service';
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
    private annotationPositionService: AnnotationPositionService,
    private sanitizer: DomSanitizer,
    private detectorRef: ChangeDetectorRef
  ) {
    super(config);

    this.logo = '/assets/mocks/pundit-icon-48-light.png';
    if (_c('chromeExt')) {
      this.logo = this.sanitizer.bypassSecurityTrustResourceUrl(`${_c('chromeExtUrl')}${this.logo}`);
    }
  }

  protected initPayload() {
    return {
      layoutEvent$: this.layoutEvent$,
      annotationService: this.annotationService,
      annotationPositionService: this.annotationPositionService,
      detectorRef: this.detectorRef
    };
  }

  ngOnInit() {
    this.onInit();
  }

  ngOnDestroy() {
    this.onDestroy();
  }
}
