import { Component, Input, OnInit } from '@angular/core';
import { Social, SocialAttributes } from '@pundit/communication';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SocialService } from 'src/app/services/social.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'pnd-social-annotation-section',
  templateUrl: './social-annotation-section.html'
})
export class SocialAnnotationSectionComponent implements OnInit {
  id = 'social';

  @Input() public data: Social[];

  @Input() public annotationId: string;

  @Input() public parentId: string;

  constructor(
    private socialService: SocialService,
    private userService: UserService
  ) { }

  // inner State;
  public userLike;

  public userDislike;

  public userReport;

  public hasComment = false;

  public likeNum = 0;

  public dislikeNum = 0;

  public reportNum = 0;

  public commentNum = 0;

  ngOnInit(): void {
    if (!this.data) {
      return;
    }
    const currentUserId = this.userService.whoami()?.id;
    const socialsOnAnnotation = this.data?.filter((s) => (s.type !== 'Comment' && !s.parentId) || s.type === 'Comment') || [];
    // const socialsOnComment = socials.filter((s) => (s.type !== 'Comment' && s.parentId));
    this.likeNum = socialsOnAnnotation.filter((s) => s.type === 'Like').length;

    this.dislikeNum = socialsOnAnnotation.filter((s) => s.type === 'Dislike').length;

    this.reportNum = socialsOnAnnotation.filter((s) => s.type === 'Report').length;

    this.commentNum = socialsOnAnnotation.filter((s) => s.type === 'Comment').length;

    const userSocialsOnAnnotation = socialsOnAnnotation.filter((s) => s.userId === currentUserId);

    this.hasComment = !!userSocialsOnAnnotation.find((s) => s.type === 'Comment');

    this.userDislike = userSocialsOnAnnotation.find((s) => s.type === 'Dislike');

    this.userLike = userSocialsOnAnnotation.find((s) => s.type === 'Like');

    this.userReport = userSocialsOnAnnotation.find((s) => s.type === 'Report');

    console.log('social state initialized');
  }

  toggleLike() {
    if (this.userLike) {
      this.removeSocial(this.userLike.id, 'Like');
    } else if (this.userDislike) {
      this.updateSocial(this.userDislike.id, 'Like');
    } else {
      this.createSocial('Like');
    }
  }

  toggleDislike() {
    if (this.userDislike) {
      this.removeSocial(this.userDislike.id, 'Dislike');
    } else if (this.userLike) {
      this.updateSocial(this.userLike.id, 'Dislike');
    } else {
      this.createSocial('Dislike');
    }
  }

  toggleReport() {
    if (this.userReport) {
      this.removeSocial(this.userReport.id, 'Report');
    } else {
      this.createSocial('Report');
    }
  }

  private createSocial(type: 'Like' | 'Dislike'| 'Report') {
    const userId = this.userService.whoami()?.id;
    const payload = {
      type, annotationId: this.annotationId, parentId: this.parentId, userId
    };
    this.socialService.create(payload).pipe(
      // emit signal on error//
      // this.emit(getEventType(EditModalEvent.CreateNotebookError), e);
      catchError(() => EMPTY)
    ).subscribe(({ data }) => {
      const { id } = data;
      const created = new Date().toISOString();
      const newSocial: Social = {
        id,
        ...payload,
        created,
        changed: created
      };
      switch (type) {
        case 'Like':
          this.userLike = newSocial;
          this.likeNum += 1;
          break;
        case 'Dislike':
          this.userDislike = newSocial;
          this.dislikeNum += 1;
          break;
        case 'Report':
          this.userReport = newSocial;
          this.reportNum += 1;
          break;
        default:
          break;
      }
    });
  }

  private updateSocial(id, type) {
    const userId = this.userService.whoami()?.id;
    const payload: SocialAttributes = {
      type, annotationId: this.annotationId, parentId: this.parentId, userId
    };
    this.socialService.update(id, payload).pipe(
      // emit signal on error//
      // this.emit(getEventType(EditModalEvent.CreateNotebookError), e);
      catchError(() => EMPTY)
    ).subscribe(() => {
      switch (type) {
        case 'Like':
          this.userLike = {
            ...payload,
            id,
            created: this.userDislike.created,
            changed: new Date().toISOString()
          };
          this.userDislike = undefined;
          this.dislikeNum -= 1;
          this.likeNum += 1;
          break;
        case 'Dislike':
          this.userDislike = {
            ...payload,
            id,
            created: this.userLike.created,
            changed: new Date().toISOString()
          };
          this.userLike = undefined;
          this.dislikeNum += 1;
          this.likeNum -= 1;

          break;
        case 'Report': {
          const { created } = this.userReport;
          this.userDislike = {
            ...payload,
            id,
            created,
            changed: new Date().toISOString()
          };
        }
          break;
        default:
          break;
      }
    });
  }

  private removeSocial(id, type: 'Like' | 'Dislike'| 'Report') {
    this.socialService.remove(id).pipe(
      // emit signal on error//
      // this.emit(getEventType(EditModalEvent.CreateNotebookError), e);
      catchError(() => EMPTY)
    ).subscribe(() => {
      switch (type) {
        case 'Like':
          this.userLike = undefined;
          this.likeNum -= 1;
          break;
        case 'Dislike':
          this.userDislike = undefined;
          this.dislikeNum -= 1;
          break;
        case 'Report':
          this.userReport = undefined;
          this.reportNum -= 1;
          break;
        default:
          break;
      }
    });
  }
}
