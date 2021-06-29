//---------------------------
// ANNOTATION.ts
//---------------------------

import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Annotation, Tag } from '@pundit/communication';
import { getTagColor } from 'src/app/helpers/tag-color.helper';
import { ImageDataService } from 'src/app/services/image-data.service';
import { Icon } from '../../types';

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
    /** User initials: image fallback */
    initials: string;
    /** Navigate to user page */
    anchor?: string;
  };
  /** Date string */
  date: string;
  /** Parent notebook data */
  notebook?: {
    /** Notebook title */
    name: string;
    /** Notebook link */
    anchor: string;
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
  /** Annotation tags */
  tags?: Tag[];
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

  constructor(
    private ref: ChangeDetectorRef,
    public imageDataService: ImageDataService,
  ) {}

  onClick(ev: Event, payload) {
    if (!this.emit) return;
    ev.stopImmediatePropagation();
    this.emit('click', payload);

    // trigger change detector
    this.ref.detectChanges();
  }

  onContainerClick(payload) {
    if (!this.emit) return;
    this.emit('click', payload);

    // trigger change detector
    this.ref.detectChanges();
  }

  onEnter(payload) {
    if (!this.emit) return;
    this.emit('mouseenter', payload);

    // trigger change detector
    this.ref.detectChanges();
  }

  onLeave(payload) {
    if (!this.emit) return;
    this.emit('mouseleave', payload);

    // trigger change detector
    this.ref.detectChanges();
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onNotebookSelection = (type, payload) => {
    if (!this.emit) return;
    const annotationID = this.data.payload.id;
    const notebookID = payload;
    if (!annotationID || !notebookID) return;
    this.emit(type, { annotation: annotationID, notebook: notebookID });

    // trigger change detector
    this.ref.detectChanges();
  }

  getTagColor(tag: string) {
    return getTagColor(tag);
  }
}
