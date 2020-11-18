import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { MainLayoutConfig as config } from './main-layout.config';

@Component({
  selector: 'pnd-main-layout',
  templateUrl: './main-layout.html'
})
export class MainLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  constructor() {
    super(config);
  }

  protected initPayload() {
    return {};
  }

  ngOnInit() {
    this.onInit();
  }

  ngOnDestroy() {
    this.onDestroy();
  }
}
