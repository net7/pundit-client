import { AnnotationData } from '@n7-frontend/components';
import { DataSource } from '@n7-frontend/core';

enum MenuStates {
  'CLOSED',
  'OPEN',
  'OPEN_NOTEBOOKS',
  'OPEN_NOTEBOOKS_SELECT'
}

export class AnnotationDS extends DataSource {
  private menuState: {
    [id: string]: MenuStates;
  } = {};

  transform(data): AnnotationData[] {
    return data;
  }

  toggleCollapse(id: string) {
    const annotation = this.getAnnotation(id);
    annotation.isCollapsed = !annotation.isCollapsed;

    if (annotation.isCollapsed) {
      this.closeMenu(id);
    }
  }

  closeMenu(id: string) {
    this.menuState[id] = MenuStates.CLOSED;
    this.updateClasses(id);
  }

  updateMenuState(id: string, source) {
    switch (source) {
      case 'menu-header':
        this.menuState[id] = !this.menuState[id] || this.menuState[id] === MenuStates.CLOSED
          ? MenuStates.OPEN
          : MenuStates.CLOSED;
        break;
      case 'action-notebooks':
        this.menuState[id] = this.menuState[id] === MenuStates.OPEN
          ? MenuStates.OPEN_NOTEBOOKS
          : MenuStates.OPEN;
        break;
      case 'notebooks-header':
        this.menuState[id] = this.menuState[id] === MenuStates.OPEN_NOTEBOOKS
          ? MenuStates.OPEN_NOTEBOOKS_SELECT
          : MenuStates.OPEN_NOTEBOOKS;
        break;
      default:
        break;
    }
    this.updateClasses(id);
  }

  private updateClasses(id: string) {
    const annotation = this.getAnnotation(id);
    let classes = '';
    if (this.menuState[id] === MenuStates.OPEN) {
      classes = 'is-open';
    } else if (this.menuState[id] === MenuStates.OPEN_NOTEBOOKS) {
      classes = 'is-open is-notebooks-open';
    } else if (this.menuState[id] === MenuStates.OPEN_NOTEBOOKS_SELECT) {
      classes = 'is-open is-notebooks-open is-notebooks-select-open';
    }
    annotation.classes = classes;
  }

  private getAnnotation(id: string) {
    return this.output.find(({ _meta }) => _meta.id === id);
  }
}
