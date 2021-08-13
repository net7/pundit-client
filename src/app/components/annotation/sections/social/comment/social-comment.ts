import { Component, Input, OnInit } from '@angular/core';
import { _t } from '@n7-frontend/core';
import {
  SocialType, AnnotationComment
} from '@pundit/communication';
import { Observable } from 'rxjs';
import { CommentService } from 'src/app/services/comment.service';
import { SocialService } from 'src/app/services/social.service';
import { UserService } from 'src/app/services/user.service';

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

  private tmpEdit;

  private isLoading = false;

  constructor(
    private userService: UserService,
    private commentService: CommentService,
    private socialService: SocialService
  ) {}

  ngOnInit(): void {
    this.socials$ = this.socialService.getStatsByAnnotationId$(this.annotationId, this.data.id);
    this.menuData = this.getMenuData();
  }

  private getMenuData() {
    const currentUser = this.userService.whoami()?.id;
    const actions = this.createActionButtons(this.annotationId);
    return currentUser
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
    if (!payload || this.isLoading) {
      return;
    }
    const { source } = payload;
    if (source === 'action-delete') {
      this.delete();
      this.activeMenu = null;
    } else if (source === 'action-edit') {
      this.activeMenu = 'edit-comment';
    } else if (source === 'social-comment-menu-header') {
      this.activeMenu = 'display-menu';
    }
  }

  delete() {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.commentService.remove(this.data.id).subscribe(() => {
      this.isLoading = false;
    });
  }

  onCommentChange(payload) {
    this.tmpEdit = payload;
  }

  onCommentClose() {
    this.activeMenu = null;
  }

  onCommentSave() {
    const userId = this.userService.whoami()?.id;
    if (!userId || userId !== this.data.userId || this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.commentService.update(this.data.id,
      {
        userId, type: 'Comment', annotationId: this.annotationId, comment: this.tmpEdit
      }).subscribe(() => {
      this.isLoading = false;
      this.activeMenu = null;
    });
  }
}
