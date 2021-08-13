import { Injectable } from '@angular/core';
import {
  AnnotationComment, AnnotationCommentAttributes
} from '@pundit/communication';
import { BehaviorSubject, from } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { CommentModel } from 'src/common/models/comment-model';
import { UserService } from './user.service';

type CommentConfig= {
  annotationId: string;
  comments$: BehaviorSubject<AnnotationComment[]>;
}
@Injectable()
export class CommentService {
  private commentsByAnnotationId: CommentConfig[] = [];

  constructor(
    private userService: UserService
  ) { }

  load(rawComments: AnnotationComment[]) {
    rawComments.forEach((c) => this.add(c));
  }

  /**
   * Create a new comment on the backend
   * and add it to the local cache.
   */
  create(attributes: AnnotationCommentAttributes) {
    return from(CommentModel.create({ data: attributes })).pipe(
      tap(({ data }) => {
        const { id } = data;
        const requestPayload = attributes;
        const newComment = this.getCommentFromPayload(
          id, requestPayload
        );
        this.add(newComment);
      })
    );
  }

  /**
   * Load a comment that already exists into the client
   * @param rawComment
   */
  add(rawComment: AnnotationComment) {
    const { annotationId } = rawComment;
    const comments$ = this.getCommentsByAnnotationId$(annotationId);
    comments$.pipe(take(1)).subscribe((comments) => {
      const index = comments.map(({ id }) => id).indexOf(rawComment.id);
      // if annotation exists update auth related info
      if (index > -1) {
        comments[index] = rawComment;
      } else {
        comments.push(rawComment);
      }
      comments$.next(comments);
    });
  }

  /**
   * Update a cached comment.
   * To change the data on the backend use "../models/comment/update" instead!
   * @param commentId id of the comment to update
   * @param data data of the comment that you want to change
   */
  update(commentId: string, data: AnnotationCommentAttributes) {
    return from(CommentModel.update(commentId, { data }))
      .pipe(
        tap(() => {
          const comments$ = this.getCommentsByAnnotationId$(data.annotationId);
          if (!comments$) return;
          comments$.pipe(take(1)).subscribe((comments) => {
            const index = comments.map(({ id }) => id).indexOf(commentId);
            if (index <= -1) {
              console.warn('Comment update fail');
              return;
            }
            const updatedComment = this.getCommentFromPayload(commentId, data);
            const { created } = comments[index];
            comments[index] = { ...updatedComment, created };
            comments$.next(comments);
          });
        })
      );
  }

  /**
   * Requests to delete the comment on the backend,
   * then updates the local cache.
   *
   * @param commentId ID of the comment to delete
   */
  remove(commentId: string) {
    return from(CommentModel.remove(commentId)).pipe(
      tap(() => {
        this.removeCached(commentId);
      })
    );
  }

  removeCached(commentId: string) {
    this.commentsByAnnotationId.forEach((commentItem) => {
      const { comments$ } = commentItem;
      comments$.pipe(take(1)).subscribe((comments) => {
        const index = comments.map(({ id }) => id).indexOf(commentId);
        if (index > -1) {
          comments.splice(index, 1);
          comments$.next(comments);
        }
      });
    });
  }

  removeCachedByAnnotationId(annotationId: string) {
    this.commentsByAnnotationId = this.commentsByAnnotationId.filter(
      (c) => c.annotationId !== annotationId
    );
  }

  getCommentsByAnnotationId$(id: string): BehaviorSubject<AnnotationComment[]> {
    let result = this.commentsByAnnotationId.find((item) => item.annotationId === id);
    if (!result) {
      result = {
        annotationId: id,
        comments$: new BehaviorSubject([])
      };
      this.commentsByAnnotationId.push(result);
    }
    return result.comments$;
  }

  getCommentFromPayload(id: string, payload: AnnotationCommentAttributes): AnnotationComment {
    const userId = this.userService.whoami().id;
    const created = new Date().toISOString();
    const newComment = {
      ...payload, userId, created, changed: created, id
    };
    return newComment;
  }

  clear() {
    this.commentsByAnnotationId = [];
  }
}
