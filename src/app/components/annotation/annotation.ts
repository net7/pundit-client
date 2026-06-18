//---------------------------
// ANNOTATION.ts
//---------------------------

import { ChangeDetectorRef, Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  Annotation, Reply, Tag
} from '@pundit/communication';
import { BehaviorSubject, Observable } from 'rxjs';
import { getTagColor } from 'src/app/helpers/tag-color.helper';
import { AnnotationState } from 'src/app/services/annotation.service';
import { ReplyService } from 'src/app/services/reply.service';
import { ImageDataService } from 'src/app/services/image-data.service';
import { SocialService } from 'src/app/services/social.service';
import { Icon, SemanticItem } from '../../types';
import { NgClass, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { HeaderAnnotationSectionComponent } from './sections/header/header-annotation-section';
import { HighlightAnnotationSectionComponent } from './sections/highlight/highlight-annotation-section';
import { CommentAnnotationSectionComponent } from './sections/comment/comment-annotation-section';
import { SemanticAnnotationSectionComponent } from './sections/semantic/semantic-annotation-section';
import { TagAnnotationSectionComponent } from './sections/tag/tag-annotation-section';
import { SocialAnnotationSectionComponent } from './sections/social/social-annotation-section';

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
    templateUrl: './annotation.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, NgTemplateOutlet, HeaderAnnotationSectionComponent, HighlightAnnotationSectionComponent, CommentAnnotationSectionComponent, SemanticAnnotationSectionComponent, TagAnnotationSectionComponent, SocialAnnotationSectionComponent, AsyncPipe]
})
export class AnnotationComponent implements OnInit {
  private ref = inject(ChangeDetectorRef);
  imageDataService = inject(ImageDataService);
  socialService = inject(SocialService);
  replyService = inject(ReplyService);

  @Input() data!: AnnotationData;

  @Input() emit: any;

  @Input() data$!: BehaviorSubject<Annotation>;

  @Input() state$!: BehaviorSubject<AnnotationState>;

  @Input() public annotationId!: string;

  @Input() public serializedBy!: string;

  public socials$!: Observable<any>;

  public replies$!: Observable<Reply[]>;

  ngOnInit() {
    this.socials$ = this.socialService.getStatsByAnnotationId$(this.annotationId);
    this.replies$ = this.replyService.getRepliesByAnnotationId$(this.annotationId);
  }

  onContainerClick(payload: any) {
    if (!this.emit) return;
    this.emit('click', payload);

    // trigger change detector
    this.ref.markForCheck();
  }

  onEnter(payload: any) {
    if (!this.emit) return;
    this.emit('mouseenter', payload);

    // trigger change detector
    this.ref.markForCheck();
  }

  onLeave(payload: any) {
    if (!this.emit) return;
    this.emit('mouseleave', payload);

    // trigger change detector
    this.ref.markForCheck();
  }

  getTagColor(tag: string) {
    return getTagColor(tag);
  }
}
