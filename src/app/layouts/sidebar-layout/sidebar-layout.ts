import {
  Component, OnInit, OnDestroy, Input
} from '@angular/core';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { Subject } from 'rxjs';
import { SidebarLayoutConfig as config } from './sidebar-layout.config';

@Component({
  selector: 'sidebar-layout',
  templateUrl: './sidebar-layout.html'
})
export class SidebarLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  @Input() layoutCommunication$: Subject<any>;

  constructor(
    // private communication: CommunicationService,
  ) {
    super(config);
  }

  protected initPayload() {
    return {
      // communication: this.communication,
    };
  }

  ngOnInit() {
    this.onInit();
  }

  ngOnDestroy() {
    this.onDestroy();
  }
}
