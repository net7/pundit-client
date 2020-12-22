import { AnnotationData } from '@n7-frontend/components';
import { DataSource } from '@n7-frontend/core';

export class AnnotationDS extends DataSource {
  transform(data): AnnotationData[] {
    return data;
  }

  toggleCollapse(id: string) {
    const annotation: AnnotationData = this.output.find(({ _meta }) => _meta === id);
    if (annotation) {
      annotation.isCollapsed = !annotation.isCollapsed;
    }
  }
}
