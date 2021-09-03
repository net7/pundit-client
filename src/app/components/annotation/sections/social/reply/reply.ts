import { Component, Input, OnInit } from '@angular/core';
import { _t } from '@n7-frontend/core';
import {
  SocialType, Reply
} from '@pundit/communication';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { _c } from 'src/app/models/config';
import { ReplyService } from 'src/app/services/reply.service';
import { ImageDataService } from 'src/app/services/image-data.service';
import { SocialService } from 'src/app/services/social.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserData, UserService } from 'src/app/services/user.service';

export type ReplyFormState = {
  value?: string;
  actions?: {label: string; source: string; disabled?: boolean }[];
  isLoading?: boolean;
}

export type ReplyType = 'Reply';

@Component({
  selector: 'pnd-annotation-reply',
  templateUrl: './reply.html'
})
export class ReplyComponent implements OnInit {
  @Input() public data: Reply

  @Input() public annotationId: string;

  @Input() public emit: any;

  public readonly ACTIONS: SocialType[] = ['Like', 'Dislike', 'Report'];

  public socials$: Observable<any>;

  public menuData;

  public activeMenu;

  public formState: ReplyFormState;

  public userData;

  constructor(
    private userService: UserService,
    private replyService: ReplyService,
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

  private resetFormState = (newReply: string) => {
    const isValidReply = (reply: string): boolean => reply && reply.length > 3;
    return {
      value: newReply,
      actions: [{
        label: _t('social#reply-save'),
        source: 'save',
        disabled: !isValidReply(newReply) && this.data.comment !== newReply,
      },
      {
        label: _t('social#reply-cancel'),
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
            source: 'reply-menu-header',
          },
        },
        actions
      }
      : null;
  }

  private createActionButtons= (id) => [{
    label: _t('social#reply_edit'),
    payload: {
      id,
      source: 'action-edit',
    },
  },
  {
    label: _t('social#reply_delete'),
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
      this.activeMenu = 'edit-reply';
      this.checkFocus();
    } else if (source === 'reply-menu-header' && !this.activeMenu) {
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
    this.replyService.remove(this.data.id)
      .pipe(catchError(() => {
        this.toastService.error({
          title: _t('toast#annotation_reply_delete_error_title'),
          text: _t('toast#annotation_reply_edelete_error_text'),
        });
        this.formState.isLoading = false;
        return EMPTY;
      }))
      .subscribe((response) => {
        if (response) {
          this.toastService.success(
            {
              title: _t('toast#annotation_reply_delete_success_title'),
              text: _t('toast#annotation_reply_delete_success_text'),
            }
          );
        }
        this.formState.isLoading = false;
      });
  }

  onReplyChange(payload) {
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
      this.replyService.update(this.data.id,
        {
          userId, type: 'Comment', annotationId: this.annotationId, comment: this.formState.value
        }).pipe(catchError(() => {
        this.toastService.error({
          title: _t('toast#annotation_reply_edit_error_title'),
          text: _t('toast#annotation_reply_edit_error_text'),
        });

        this.formState.isLoading = false;
        this.activeMenu = null;
        return EMPTY;
      })).subscribe((response) => {
        if (response) {
          this.toastService.success(
            {
              title: _t('toast#annotation_reply_edit_success_title'),
              text: _t('toast#annotation_reply_edit_success_text'),
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
    return shadowRoot.querySelector(`textarea#${this.data.id}.pnd-annotation__reply-textarea`) as HTMLTextAreaElement;
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
