import { AnnotationData } from '@n7-frontend/components';
import { DataSource } from '@n7-frontend/core';

export class AnnotationDS extends DataSource {
  transform(data: AnnotationData[]): AnnotationData[] {
    return data;
  }

  toggleCollapse(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.isCollapsed = !annotation.isCollapsed;
  }

  updateMenuState(id: string, source) {
    const annotation = this.getAnnotation(id);
    if (source === 'menu-header') {
      annotation.activeMenu = annotation.activeMenu ? undefined : 'actions';
    }
    if (source === 'action-notebooks') {
      annotation.activeMenu = 'notebooks';
    }
  }

  private getAnnotation(id: string) {
    return this.output.find(({ _meta }) => _meta.id === id);
  }
}
