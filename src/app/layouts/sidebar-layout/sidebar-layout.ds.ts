import { ANNOTATION_MOCK } from '@n7-frontend/components';
import { LayoutDataSource } from '@n7-frontend/core';
import { cloneDeep } from 'lodash';

export class SidebarLayoutDS extends LayoutDataSource {
  private communication;

  public annotations = [
    cloneDeep(ANNOTATION_MOCK),
    cloneDeep(ANNOTATION_MOCK),
    cloneDeep(ANNOTATION_MOCK),
    cloneDeep(ANNOTATION_MOCK),
    cloneDeep(ANNOTATION_MOCK),
    cloneDeep(ANNOTATION_MOCK),
    cloneDeep(ANNOTATION_MOCK),
  ]

  onInit(payload) {
    this.communication = payload.communication;
  }
}
