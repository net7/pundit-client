import {
  Component, OnInit, OnDestroy, Input
} from '@angular/core';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { ReplaySubject } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { SidebarLayoutConfig as config } from './sidebar-layout.config';
import { LayoutEvent } from '../main-layout/main-layout';

@Component({
  selector: 'sidebar-layout',
  templateUrl: './sidebar-layout.html'
})
export class SidebarLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  @Input() layoutEvent$: ReplaySubject<LayoutEvent>;

  constructor(
    private annotationService: AnnotationService
  ) {
    super(config);
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
