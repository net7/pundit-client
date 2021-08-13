import { Component, Input, OnInit } from '@angular/core';
import { _t } from '@n7-frontend/core';
import {
  AnnotationComment,
  AnnotationCommentAttributes, SocialType
} from '@pundit/communication';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { CommentService } from 'src/app/services/comment.service';
import { SocialService, SocialStats } from 'src/app/services/social.service';
import { UserService } from 'src/app/services/user.service';
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
  comment?: {
    madeByUser?: boolean;
    total: number;
    tmpNewComment?: string;
    toggleComment?: boolean;
  };

  isLogged: boolean;

  isLoading: boolean;
}

@Component({
  selector: 'pnd-social-action-bar',
  templateUrl: './social-action-bar.html'
})
export class SocialActionBarComponent implements OnInit {
  @Input() socials$: Observable<SocialStats>

  @Input() comments$: Observable<AnnotationComment[]>;

  @Input() annotationId: string;

  @Input() parentId: string;

  @Input() emit: any;

  @Input() actions: (SocialType | 'Comment')[];

  public newCommentSaveLabel = _t('social#save');

  public newCommentCancelLabel = _t('social#cancel');

  public state: SocialBarState;

  constructor(
    private userService: UserService,
    private punditLoginService: PunditLoginService,
    private socialService: SocialService,
    private commentService: CommentService
  ) { }

  ngOnInit(): void {
    this.initState();
    this.socials$.subscribe((socials) => {
      this.setSocialState(socials);
    });
    if (this.comments$) {
      this.comments$.subscribe((comments) => {
        this.setCommentState(comments);
      });
    }
    this.userService.logged$.subscribe((logged) => {
      this.state.isLogged = logged;
      if (!logged) {
        this.state.isLoading = false;
        if (this.state?.comment) {
          this.state.comment.toggleComment = false;
          this.state.comment.tmpNewComment = '';
        }
      }
    });
  }

  private initState = () => {
    this.state = {
      like: this.actions.includes('Like') ? { total: 0, } : undefined,
      dislike: this.actions.includes('Dislike') ? { total: 0 } : undefined,
      report: this.actions.includes('Report') ? { total: 0 } : undefined,
      endorse: this.actions.includes('Endorse') ? { total: 0 } : undefined,
      comment: this.actions.includes('Comment') ? { total: 0 } : undefined,
      isLoading: false,
      isLogged: false,
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

  private setCommentState(comments: AnnotationComment[]) {
    const currentUserId = this.userService.whoami()?.id;
    const isCommentFromCurrentUser = (c) => c.userId === currentUserId;
    if (this.state?.comment) {
      const userComments = !!comments.filter(isCommentFromCurrentUser);
      this.state.comment = {
        ...this.state.comment,
        madeByUser: userComments,
        total: comments.length,
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

  toggleComment() {
    if (!this.state?.comment) {
      return;
    }
    if (!this.state.isLogged) {
      this.punditLoginService.start();
      return;
    }
    this.state.comment.toggleComment = !this.state.comment.toggleComment;
    this.state.comment.tmpNewComment = '';
  }

  private like() {
    if (this.state.like?.madeByUser) {
      const newStats = { totalLikes: this.state.like.total - 1, hasUserLike: false }as SocialStats;
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
    }).subscribe(() => {});
  }

  private removeSocial(type: SocialType) {
    const userId = this.userService.whoami()?.id;
    this.socialService.remove({
      userId,
      annotationId: this.annotationId,
      parentId: this.parentId,
      type
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    }).subscribe(() => {});
  }

  onCommentSave() {
    if (this.state.isLoading) {
      return;
    }
    const payload: AnnotationCommentAttributes = {
      type: 'Comment',
      userId: this.userService.whoami().id,
      annotationId: this.annotationId,
      comment: this.state.comment.tmpNewComment
    };
    this.state.isLoading = true;
    this.commentService.create(payload).pipe(
      catchError(() => {
        this.state.isLoading = false;
        this.onCommentClose();
        return EMPTY;
      })
    ).subscribe(
      () => {
        this.onCommentClose();
      }
    );
  }

  onCommentClose() {
    this.state.comment.toggleComment = false;
    this.state.comment.tmpNewComment = '';
  }

  onCommentChange(e: string) {
    this.state.comment.tmpNewComment = e;
  }
}
