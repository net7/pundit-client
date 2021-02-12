//---------------------------
// ANNOTATION.ts
//---------------------------

import { Component, Input } from '@angular/core';
import { Annotation } from '@pundit/communication';
import { Anchor, Icon } from '../../types';

/**
 * Interface for AnnotationComponent's "data"
 *
 * @property user (required)
 *  - image (optional)
 *  - name (required)
 *  - anchor (optional)
 * @property date (required)
 * @property notebook (required)
 *  - name (required)
 *  - anchor (optional)
 * @property icon (optional)
 * @property body (required)
 * @property comment (optional)
 * @property classes (optional)
 */
export interface AnnotationData {
  /** User data */
  user: {
    /** Profile picture */
    image: string;
    /** User full name */
    name: string;
    /** Navigate to user page */
    anchor?: Anchor;
  };
  /** Date string */
  date: string;
  /** Parent notebook data */
  notebook: {
    /** Notebook title */
    name: string;
    /** Notebook navigation */
    anchor: Anchor;
  };
  /** View the annotation in a minimal form */
  isCollapsed: boolean;
  /** Menu in the top-right corner of the annotation */
  menu?: {
    icon: Icon;
    actions: {
      label: string;
      payload: any;
    }[];
    notebooks: {
      header: {
        label: string;
        payload: any;
      };
      items: {
        label: string;
        payload: any;
      }[];
    };
    classes?: string;
  };
  /** Visible menu */
  activeMenu?: 'actions' | 'notebooks';
  /** Annotated text */
  body: string;
  /** Annotation comment */
  comment?: string;
  /** HTML Classes */
  classes?: string;
  /** element click payload */
  payload?: any;
  /** additional data useful for the component's logic */
  _meta?: any;
  /** rawAnnotation data from the backend */
  _raw?: Annotation;
}

@Component({
  selector: 'annotation',
  templateUrl: './annotation.html'
})
export class AnnotationComponent {
  @Input() data: AnnotationData;

  @Input() emit: any;

  onClick(ev: Event, payload) {
    if (!this.emit) return;
    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onChange(ev: Event, payload) {
    if (!this.emit) return;
    ev.stopPropagation();
    this.emit('change', payload);
  }

  onContainerClick(payload) {
    if (!this.emit) return;
    this.emit('click', payload);
  }

  onEnter(payload) {
    if (!this.emit) return;
    this.emit('mouseenter', payload);
  }

  onLeave(payload) {
    if (!this.emit) return;
    this.emit('mouseleave', payload);
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onNotebookSelection = (type, payload) => {
    if (!this.emit) return;
    this.emit(type, payload);
  }
}
