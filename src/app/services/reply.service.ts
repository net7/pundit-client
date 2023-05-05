import { Injectable } from '@angular/core';
import {
  Reply, ReplyAttributes
} from '@pundit/communication';
import { BehaviorSubject, from } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { AnalyticsModel } from 'src/common/models';
import { ReplyModel } from 'src/common/models/reply-model';
import { AnalyticsAction } from 'src/common/types';
import { SocialService } from './social.service';
import { UserService } from './user.service';

type ReplyData= {
  annotationId: string;
  replies$: BehaviorSubject<Reply[]>;
}
@Injectable()
export class ReplyService {
  private repliesByAnnotationId: ReplyData[] = [];

  constructor(
    private userService: UserService,
    private socialService: SocialService
  ) { }

  load(rawReplies: Reply[]) {
    rawReplies.forEach((c) => this.add(c));
  }

  /**
   * Create a new reply on the backend
   * and add it to the local cache.
   */
  create(attributes: ReplyAttributes) {
    return from(ReplyModel.create({ data: attributes })).pipe(
      tap(({ data }) => {
        const { id } = data;
        const requestPayload = attributes;
        const newReply = this.getReplyFromPayload(
          id, requestPayload
        );
        this.add(newReply);

        // analytics
        AnalyticsModel.track({
          action: AnalyticsAction.SocialComment
        });
      })
    );
  }

  /**
   * Load a reply that already exists into the client
   * @param rawReply
   */
  add(rawReply: Reply) {
    const { annotationId } = rawReply;
    const replies$ = this.getRepliesByAnnotationId$(annotationId);
    replies$.pipe(take(1)).subscribe((replies) => {
      const index = replies.map(({ id }) => id).indexOf(rawReply.id);
      // if annotation exists update auth related info
      if (index > -1) {
        replies[index] = rawReply;
      } else {
        replies.push(rawReply);
      }
      replies$.next(replies);
    });
  }

  /**
   * Update a cached reply.
   * To change the data on the backend use "../models/reply/update" instead!
   * @param replyId id of the reply to update
   * @param data data of the reply that you want to change
   */
  update(replyId: string, data: ReplyAttributes) {
    return from(ReplyModel.update(replyId, { data }))
      .pipe(
        tap(() => {
          const replies$ = this.getRepliesByAnnotationId$(data.annotationId);
          if (!replies$) return;
          replies$.pipe(take(1)).subscribe((replies) => {
            const index = replies.map(({ id }) => id).indexOf(replyId);
            if (index <= -1) {
              console.warn('Reply update fail');
              return;
            }
            const updatedReply = this.getReplyFromPayload(replyId, data);
            const { created } = replies[index];
            replies[index] = { ...updatedReply, created };
            replies$.next(replies);
          });
        })
      );
  }

  /**
   * Requests to delete the reply on the backend,
   * then updates the local cache.
   *
   * @param replyId ID of the reply to delete
   */
  remove(replyId: string) {
    return from(ReplyModel.remove(replyId)).pipe(
      tap(() => {
        this.removeCached(replyId);
      })
    );
  }

  removeCached(replyId: string) {
    this.repliesByAnnotationId.forEach((replyItem) => {
      const { replies$ } = replyItem;
      replies$.pipe(take(1)).subscribe((replies) => {
        const index = replies.map(({ id }) => id).indexOf(replyId);
        if (index > -1) {
          const { annotationId } = replies[index];
          this.socialService.removeCachedAndStats(annotationId, replyId);
          replies.splice(index, 1);
          replies$.next(replies);
        }
      });
    });
  }

  removeCachedByAnnotationId(annotationId: string) {
    this.repliesByAnnotationId = this.repliesByAnnotationId.filter(
      (c) => c.annotationId !== annotationId
    );
  }

  getRepliesByAnnotationId$(id: string): BehaviorSubject<Reply[]> {
    let result = this.repliesByAnnotationId.find((item) => item.annotationId === id);
    if (!result) {
      result = {
        annotationId: id,
        replies$: new BehaviorSubject([])
      };
      this.repliesByAnnotationId.push(result);
    }
    return result.replies$;
  }

  getReplyFromPayload(id: string, payload: ReplyAttributes): Reply {
    const userId = this.userService.whoami().id;
    const created = new Date().toISOString();
    const newReply = {
      ...payload, userId, created, changed: created, id
    };
    return newReply;
  }

  clear() {
    this.repliesByAnnotationId = [];
  }
}
