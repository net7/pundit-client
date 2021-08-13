//---------------------------
// ANNOTATION.ts
//---------------------------

import {
  ChangeDetectorRef, Component, Input, OnInit
} from '@angular/core';
import {
  Annotation, AnnotationComment, Tag
} from '@pundit/communication';
import { BehaviorSubject, Observable } from 'rxjs';
import { getTagColor } from 'src/app/helpers/tag-color.helper';
import { AnnotationState } from 'src/app/services/annotation.service';
import { CommentService } from 'src/app/services/comment.service';
import { ImageDataService } from 'src/app/services/image-data.service';
import { SocialService } from 'src/app/services/social.service';
import { Icon, SemanticItem } from '../../types';

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
  /** HTML Classes */
  classes?: string;
  /** element click payload */
  payload?: any;
  /** additional data useful for the component's logic */
  _meta?: any;

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
  /** Annotated text */
  body: string;
  /** Annotation comment */
  comment?: string;
  /** Annotation semantic */
  semantic?: {
    predicate: SemanticItem;
    object: SemanticItem;
  }[];
  /** Annotation tags */
  tags?: Tag[];

  /** rawAnnotation data from the backend */
  _raw?: Annotation;
}

@Component({
  selector: 'annotation',
  templateUrl: './annotation.html'
})
export class AnnotationComponent implements OnInit {
  @Input() data: AnnotationData;

  @Input() emit: any;

  @Input() data$: BehaviorSubject<Annotation>;

  @Input() state$: BehaviorSubject<AnnotationState>;

  @Input() public annotationId: string;

  public socials$: Observable<any>;

  public comments$: Observable<AnnotationComment[]>;

  constructor(
    private ref: ChangeDetectorRef,
    public imageDataService: ImageDataService,
    public socialService: SocialService,
    public commentService: CommentService
  ) { }

  ngOnInit() {
    this.socials$ = this.socialService.getStatsByAnnotationId$(this.annotationId);
    this.comments$ = this.commentService.getCommentsByAnnotationId$(this.annotationId);
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

  getTagColor(tag: string) {
    return getTagColor(tag);
  }
}
