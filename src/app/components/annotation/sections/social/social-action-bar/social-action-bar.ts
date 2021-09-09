import { Component, Input, OnInit } from '@angular/core';
import { _t } from '@n7-frontend/core';
import {
  Reply,
  ReplyAttributes, SocialType
} from '@pundit/communication';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { ReplyService } from 'src/app/services/reply.service';
import { SocialService, SocialStats } from 'src/app/services/social.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserService } from 'src/app/services/user.service';
import { ReplyFormState, ReplyType } from '../reply/reply';
import { } from '../social-annotation-section';

type SocialBarState = {
  like?: {
    madeByUser?: boolean;
    total: number;
  };
  dislike?: {
    madeByUser?: boolean;
    total: number;
  };
  report?: {
    madeByUser?: boolean;
    total: number;
  };
  endorse?: {
    madeByUser?: boolean;
    total: number;
  };
  reply?: {
    madeByUser?: boolean;
    total: number;
    toggleForm?: boolean;
    form: ReplyFormState;
  };
  isLogged: boolean;
}

@Component({
  selector: 'pnd-social-action-bar',
  templateUrl: './social-action-bar.html'
})
export class SocialActionBarComponent implements OnInit {
  @Input() socials$: Observable<SocialStats>

  @Input() replies$: Observable<Reply[]>;

  @Input() annotationId: string;

  @Input() parentId: string;

  @Input() emit: any;

  @Input() actions: (SocialType | ReplyType)[];

  public state: SocialBarState;

  public labels = {
    reply: _t('social#reply'),
    like: _t('social#like'),
    dislike: _t('social#dislike'),
    report: _t('social#report'),
    endorse: _t('social#endorse'),
    removeAction: (action: string) => _t('social#remove_action', {
      action: action.toLowerCase()
    })
  };

  constructor(
    private userService: UserService,
    private punditLoginService: PunditLoginService,
    private socialService: SocialService,
    private replyService: ReplyService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initState();
    this.socials$.subscribe((socials) => {
      this.setSocialState(socials);
    });
    if (this.replies$) {
      this.replies$.subscribe((replies) => {
        this.setReplyState(replies);
      });
    }
    this.userService.logged$.subscribe((logged) => {
      this.state.isLogged = logged;
      if (!logged && this.state?.reply) {
        this.state.reply.toggleForm = false;
        this.state.reply.form = this.resetFormState();
      }
    });
  }

  private initState = () => {
    this.state = {
      like: this.actions.includes('Like') ? { total: 0, } : undefined,
      dislike: this.actions.includes('Dislike') ? { total: 0 } : undefined,
      report: this.actions.includes('Report') ? { total: 0 } : undefined,
      endorse: this.actions.includes('Endorse') ? { total: 0 } : undefined,
      reply: this.actions.includes('Reply') ? { total: 0, form: this.resetFormState() } : undefined,
      isLogged: false,
    };
  }

  private resetFormState = (newReply?: string) => {
    const isValidReply = (reply: string): boolean => reply && reply.length > 3;
    return {
      value: newReply,
      actions: [{
        label: _t('social#reply-save'),
        source: 'save',
        disabled: !isValidReply(newReply),
      },
      {
        label: _t('social#reply-cancel'),
        source: 'cancel',
      }],
      isLoading: false
    };
  }

  private setSocialState(socials: SocialStats) {
    if (this.state?.like) {
      this.state.like = { total: socials.totalLikes, madeByUser: socials.hasUserLike };
    }
    if (this.state?.dislike) {
      this.state.dislike = { total: socials.totalDislikes, madeByUser: socials.hasUserDislike };
    }
    if (this.state?.report) {
      this.state.report = { total: socials.totalReports, madeByUser: socials.hasUserReport };
    }
    if (this.state?.endorse) {
      this.state.endorse = { total: socials.totalEndorses, madeByUser: socials.hasUserEndorse };
    }
  }

  private setReplyState(replies: Reply[]) {
    const currentUserId = this.userService.whoami()?.id;
    const isReplyFromUser = (c) => c.userId === currentUserId;
    if (this.state?.reply) {
      const userReplies = !!replies.filter(isReplyFromUser);
      this.state.reply = {
        ...this.state.reply,
        madeByUser: userReplies,
        total: replies.length,
      };
    }
  }

  doAction(type: SocialType) {
    if (!this.actions.includes(type)) {
      return;
    }
    if (!this.state.isLogged) {
      this.punditLoginService.start();
      return;
    }
    switch (type) {
      case 'Like':
        this.like();
        break;
      case 'Dislike':
        this.dislike();
        break;
      case 'Endorse':
        this.endorse();
        break;
      case 'Report':
        this.report();
        break;
      default:
        break;
    }
  }

  toggleReplyForm() {
    if (!this.state?.reply) {
      return;
    }
    if (!this.state.isLogged) {
      this.punditLoginService.start();
      return;
    }
    this.state.reply.toggleForm = !this.state.reply.toggleForm;
    this.checkFocus();
    this.state.reply.form = this.resetFormState();
  }

  private like() {
    if (this.state.like?.madeByUser) {
      const newStats = { totalLikes: this.state.like.total - 1, hasUserLike: false } as SocialStats;
      this.updateSocialState(newStats);
      this.removeSocial('Like');
    } else {
      const newStats = {
        hasUserDislike: false,
        hasUserLike: true,
        totalDislikes:
          this.state.dislike.madeByUser ? this.state.dislike.total - 1 : this.state.dislike.total,
        totalLikes: this.state.like.total + 1
      } as SocialStats;
      this.updateSocialState(newStats);
      this.createSocial('Like');
    }
  }

  private updateSocialState = (newStats: SocialStats) => {
    const oldStats: SocialStats = {
      totalLikes: this.state?.like?.total || 0,
      totalDislikes: this.state?.dislike?.total || 0,
      totalEndorses: this.state?.endorse?.total || 0,
      totalReports: this.state?.report?.total || 0,
      hasUserDislike: !!this.state?.dislike?.madeByUser,
      hasUserEndorse: !!this.state?.endorse?.madeByUser,
      hasUserReport: !!this.state?.report?.madeByUser,
      hasUserLike: !!this.state?.like?.madeByUser,
    };
    this.socialService.updateStatsByAnnotationId(
      { ...oldStats, ...newStats }, this.annotationId, this.parentId
    );
  }

  private dislike() {
    if (this.state.dislike?.madeByUser) {
      const newStats = {
        totalDislikes: this.state.dislike.total - 1,
        hasUserDislike: false
      } as SocialStats;
      this.updateSocialState(newStats);
      this.removeSocial('Dislike');
    } else {
      const newStats = {
        hasUserDislike: true,
        hasUserLike: false,
        totalLikes: this.state?.like.madeByUser ? this.state.like.total - 1 : this.state.like.total,
        totalDislikes: this.state.dislike.total + 1
      } as SocialStats;
      this.updateSocialState(newStats);
      this.createSocial('Dislike');
    }
  }

  private endorse() {
    if (this.state.endorse?.madeByUser) {
      const newStats = {
        totalEndorses: this.state.endorse.total - 1,
        hasUserEndorse: false
      } as SocialStats;
      this.updateSocialState(newStats);
      // service remove
      this.removeSocial('Endorse');
    } else {
      const newStats = {
        totalEndorses: this.state.endorse.total + 1,
        hasUserEndorse: true
      } as SocialStats;
      this.updateSocialState(newStats);
      this.createSocial('Endorse');
    }
  }

  private report() {
    if (this.state.report?.madeByUser) {
      const newStats = {
        totalReports: this.state.report.total - 1,
        hasUserReport: false
      } as SocialStats;
      this.updateSocialState(newStats);
      this.removeSocial('Report');
    } else {
      const newStats = {
        totalReports: this.state.report.total + 1,
        hasUserReport: true
      } as SocialStats;
      this.updateSocialState(newStats);
      this.createSocial('Report');
    }
  }

  private createSocial(type: SocialType) {
    const userId = this.userService.whoami()?.id;
    this.socialService.create({
      userId,
      annotationId: this.annotationId,
      parentId: this.parentId,
      type
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    }).subscribe(() => { });
  }

  private removeSocial(type: SocialType) {
    const userId = this.userService.whoami()?.id;
    this.socialService.remove({
      userId,
      annotationId: this.annotationId,
      parentId: this.parentId,
      type
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    }).subscribe(() => { });
  }

  onReplyFormAction(source: string) {
    if (source === 'save') {
      this.onReplySave();
    } else if (source === 'cancel') {
      this.onReplyCancel();
    }
  }

  private onReplySave() {
    if (this.state.reply.form.isLoading) {
      return;
    }
    const payload: ReplyAttributes = {
      type: 'Comment',
      userId: this.userService.whoami().id,
      annotationId: this.annotationId,
      comment: this.state.reply.form.value
    };
    this.state.reply.form.isLoading = true;
    this.replyService.create(payload).pipe(
      catchError(() => {
        this.state.reply.toggleForm = false;
        this.state.reply.form = this.resetFormState();
        this.toastService.error({
          title: _t('toast#annotation_reply_save_error_title'),
          text: _t('toast#annotation_reply_save_error_text'),
        });
        return EMPTY;
      })
    ).subscribe(
      () => {
        this.state.reply.toggleForm = false;
        this.state.reply.form = this.resetFormState();
        this.toastService.success({
          title: _t('toast#annotation_reply_save_success_title'),
          text: _t('toast#annotation_reply_save_success_text'),
        });
      }
    );
  }

  private onReplyCancel() {
    this.state.reply.toggleForm = false;
    this.state.reply.form = this.resetFormState();
  }

  onReplyChange(e: string) {
    this.state.reply.form = this.resetFormState(e);
  }

  private checkFocus = () => {
    if (this.state.reply.toggleForm) {
      setTimeout(() => {
        const el = this.getTextAreaEl();
        el.focus();
      });
    }
  }

  private getTextAreaEl() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    return shadowRoot.querySelector(`textarea#${this.annotationId}.pnd-annotation__reply-textarea`) as HTMLTextAreaElement;
  }
}
