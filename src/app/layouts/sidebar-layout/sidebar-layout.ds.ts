import { LayoutDataSource } from '@n7-frontend/core';

export class SidebarLayoutDS extends LayoutDataSource {
  private communication;

  onInit(payload) {
    this.communication = payload.communication;
  }
}
