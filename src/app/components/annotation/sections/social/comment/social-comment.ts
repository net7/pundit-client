import { Component, Input, OnInit } from '@angular/core';
import { _t } from '@n7-frontend/core';
import {
  SocialType, AnnotationComment
} from '@pundit/communication';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { CommentService } from 'src/app/services/comment.service';
import { ImageDataService } from 'src/app/services/image-data.service';
import { SocialService } from 'src/app/services/social.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserData, UserService } from 'src/app/services/user.service';

export type SocialCommentFormState = {
  value?: string;
  actions?: {label: string; source: string; disabled?: boolean }[];
  isLoading?: boolean;
}

@Component({
  selector: 'pnd-social-comment',
  templateUrl: './social-comment.html'
})
export class SocialCommentComponent implements OnInit {
  @Input() public data: AnnotationComment

  @Input() public annotationId: string;

  @Input() public emit: any;

  public readonly ACTIONS: SocialType[] = ['Like', 'Dislike', 'Report'];

  public socials$: Observable<any>;

  public menuData;

  public activeMenu;

  public formState: SocialCommentFormState;

  public userData;

  constructor(
    private userService: UserService,
    private commentService: CommentService,
    private socialService: SocialService,
    private toastService: ToastService,
    public imageDataService: ImageDataService
  ) {}

  ngOnInit(): void {
    this.socials$ = this.socialService.getStatsByAnnotationId$(this.annotationId, this.data.id);
    this.formState = this.resetFormState(this.data.comment);
    this.userService.logged$.subscribe(() => {
      this.menuData = this.getMenuData();
    });
    this.userData = this.getUserData(this.data.userId);
  }

  private resetFormState = (newComment: string) => {
    const isValidComment = (comment: string): boolean => comment && comment.length > 3;
    return {
      value: newComment,
      actions: [{
        label: _t('social#comment-save'),
        source: 'save',
        disabled: !isValidComment(newComment) && this.data.comment !== newComment,
      },
      {
        label: _t('social#comment-cancel'),
        source: 'cancel',
      }]
    };
  }

  private getMenuData() {
    const currentUser = this.userService.whoami()?.id;
    const actions = this.createActionButtons(this.annotationId);
    return currentUser === this.data.userId
      ? {
        icon: {
          id: 'ellipsis-v',
          payload: {
            id: this.annotationId,
            source: 'social-comment-menu-header',
          },
        },
        actions
      }
      : null;
  }

  private createActionButtons= (id) => [{
    label: _t('social#comment_edit'),
    payload: {
      id,
      source: 'action-edit',
    },
  },
  {
    label: _t('social#comment_delete'),
    payload: {
      id,
      source: 'action-delete',
    },
  }]

  onClick($event, payload) {
    if (!payload || this.formState?.isLoading) {
      return;
    }
    const { source } = payload;

    if (source === 'action-delete') {
      this.delete();
      this.activeMenu = null;
    } else if (source === 'action-edit') {
      this.activeMenu = 'edit-comment';
      this.checkFocus();
    } else if (source === 'social-comment-menu-header' && !this.activeMenu) {
      this.activeMenu = 'display-menu';
    } else {
      this.activeMenu = null;
    }
  }

  delete() {
    if (this.formState?.isLoading) {
      return;
    }
    this.formState.isLoading = true;
    this.commentService.remove(this.data.id)
      .pipe(catchError(() => {
        this.toastService.error({
          title: _t('toast#social_commentdelete_error_title'),
          text: _t('toast#social_commentedelete_error_text'),
        });
        this.formState.isLoading = false;
        return EMPTY;
      }))
      .subscribe((response) => {
        if (response) {
          this.toastService.success(
            {
              title: _t('toast#social_commentdelete_success_title'),
              text: _t('toast#social_commentdelete_success_text'),
            }
          );
        }
        this.formState.isLoading = false;
      });
  }

  onCommentChange(payload) {
    this.formState = this.resetFormState(payload);
  }

  onEditFormAction(source: string) {
    if (source === 'cancel') {
      this.activeMenu = null;
    } else if (source === 'save') {
      const userId = this.userService.whoami()?.id;
      if (!userId || userId !== this.data.userId || this.formState.isLoading) {
        return;
      }
      this.formState.isLoading = true;
      this.commentService.update(this.data.id,
        {
          userId, type: 'Comment', annotationId: this.annotationId, comment: this.formState.value
        }).pipe(catchError(() => {
        this.toastService.error({
          title: _t('toast#social_commentedit_error_title'),
          text: _t('toast#social_commentedit_error_text'),
        });

        this.formState.isLoading = false;
        this.activeMenu = null;
        return EMPTY;
      })).subscribe((response) => {
        if (response) {
          this.toastService.success(
            {
              title: _t('toast#social_commentedit_success_title'),
              text: _t('toast#social_commentedit_success_text'),
            }
          );
        }
        this.formState.isLoading = false;
        this.activeMenu = null;
      });
    }
  }

  private checkFocus = () => {
    setTimeout(() => {
      const el = this.getTextAreaEl();
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  private getTextAreaEl() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    return shadowRoot.querySelector(`textarea#${this.data.id}.pnd-annotation__social__comment-textarea`) as HTMLTextAreaElement;
  }

  private getUserData(userId: string) {
    const user = this.userService.getUserById(userId);
    let separator = ' ';
    // is email check
    if (user.username.includes('@')) {
      separator = '@';
    }
    const initials = (user.username as string)
      .split(separator)
      .map((word: string) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return {
      initials,
      image: user.thumb || _c('userDefaultThumb'),
      name: user.username,
      anchor: this.isCurrentUser(user)
        ? _c('userLink')
        : null
    };
  }

  private isCurrentUser(user: UserData) {
    const currentUser = this.userService.whoami();
    return user.id === currentUser?.id;
  }
}
