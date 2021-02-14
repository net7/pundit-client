import { DataSource } from '@n7-frontend/core';
import { AnnotationData } from '../components/annotation/annotation';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';

export class AnnotationDS extends DataSource {
  transform(data: AnnotationData[]): AnnotationData[] {
    return data;
    return data.map((d) => ({
      ...d,
      _meta: {
        notebookSelectorData: {
          createOption: {
            label: 'New Notebook',
            value: 'createnew',
          }
        } as NotebookSelectorData
      }
    }));
  }

  toggleCollapse(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.isCollapsed = !annotation.isCollapsed;
  }

  setCollapsedState(id: string, collapse: boolean) {
    const annotation = this.getAnnotation(id);
    annotation.isCollapsed = collapse;
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

  onAnnotationUpdate({ annotationID, notebook }) {
    const annotation = this.getAnnotation(annotationID);
    annotation.notebook = {
      name: notebook.label,
      anchor: {
        payload: { source: 'notebook', id: notebook.id }
      }
    };
  }

  onAnchorMouseOver(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.classes = 'is-hovered';
  }

  onAnchorMouseLeave(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.classes = '';
  }

  onAnchorClick(id: string) {
    this.toggleCollapse(id);
  }

  private getAnnotation(id: string): AnnotationData {
    return this.output.find(({ _meta }) => _meta.id === id);
  }
}
