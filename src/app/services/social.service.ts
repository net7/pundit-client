import { Injectable, OnInit } from '@angular/core';
import { Social, SocialAttributes } from '@pundit/communication';
import {
  BehaviorSubject, EMPTY, from, Observable
} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SocialModel } from 'src/common/models';
import { UserService } from './user.service';

export type SocialStats = {
  totalLikes: number;
  totalDislikes: number;
  totalReports: number;
  totalEndorses: number;
  hasUserLike: boolean;
  hasUserDislike: boolean;
  hasUserReport: boolean;
  hasUserEndorse: boolean;
}

type SocialConfig = {
  annotationId: string;
  parentId?: string;
  stats$: BehaviorSubject<SocialStats>;
}

@Injectable()
export class SocialService implements OnInit {
  private socialCache: Social[] = [];

  private socialStatsByAnnotationId: SocialConfig[] = [];

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    this.userService.logged$.subscribe(() => {
      this.refreshStats();
    });
  }

  load= (rawSocials: Social[]) => {
    rawSocials.forEach((social) => this.addToCache(social));
    this.refreshStats();
  }

  /**
   * Load a social that already exists into the client
   * @param rawSocial
   */
  addToCache = (rawSocial: Social) => {
    const index = this.socialCache.findIndex((s) => s.id === rawSocial.id);
    if (index > -1) {
      this.socialCache[index] = rawSocial;
    } else {
      this.socialCache.push(rawSocial);
    }
  }

  removeCached(socialId: string) {
    const index = this.socialCache.findIndex((s) => s.id === socialId);
    if (index > -1) {
      this.socialCache.splice(index, 1);
    }
  }

  removeCachedAndStats(annotationId: string, parentId?: string) {
    const socials = this.socialCache.filter(
      (s) => s.annotationId === annotationId && s.parentId === parentId
    );
    socials.forEach((s) => this.removeCached(s.id));
    this.removeStats(annotationId, parentId);
  }

  private removeStats(annotationId: string, parentId?: string) {
    if (parentId) {
      const index = this.socialStatsByAnnotationId.findIndex(
        (s) => s.annotationId === annotationId && parentId === s.parentId
      );
      if (index > -1) {
        this.socialStatsByAnnotationId.splice(index, 1);
      }
    } else {
      this.socialStatsByAnnotationId = this.socialStatsByAnnotationId.filter(
        (s) => s.annotationId !== annotationId
      );
    }
  }

  private refreshStats() {
    this.socialCache.forEach((social) => {
      const { parentId, annotationId } = social;
      const stats = this.calculateStats(annotationId, parentId);
      this.updateStatsByAnnotationId(stats, annotationId, parentId);
    });
  }

  private calculateStats(annotaitonId: string, parentId: string): SocialStats {
    const socials = this.socialCache.filter(
      (s) => s.annotationId === annotaitonId && s.parentId === parentId
    );
    const currentUserId = this.userService.whoami()?.id;
    const isSocialFromCurrentUser = (s) => s.userId === currentUserId;

    const likes = socials.filter((s) => s.type === 'Like');
    const totalLikes = likes.length;
    const hasUserLike = !!likes.find(isSocialFromCurrentUser);

    const dislikes = socials.filter((s) => s.type === 'Dislike');
    const totalDislikes = dislikes.length;
    const hasUserDislike = !!dislikes.find(isSocialFromCurrentUser);

    const reports = socials.filter((s) => s.type === 'Report');
    const totalReports = reports.length;
    const hasUserReport = !!reports.find(isSocialFromCurrentUser);

    const endorses = socials.filter((s) => s.type === 'Endorse');
    const totalEndorses = endorses.length;
    const hasUserEndorse = !!endorses.find(isSocialFromCurrentUser);

    return {
      totalLikes,
      hasUserDislike,
      totalDislikes,
      totalEndorses,
      totalReports,
      hasUserReport,
      hasUserEndorse,
      hasUserLike
    };
  }

  public updateStatsByAnnotationId(stats: SocialStats, annotationId: string, parentId?: string) {
    const index = this.socialStatsByAnnotationId.findIndex(
      (s) => s.annotationId === annotationId && s?.parentId === parentId
    );
    if (index > -1) {
      this.socialStatsByAnnotationId[index].stats$.next(stats);
    } else {
      this.socialStatsByAnnotationId.push({
        annotationId,
        parentId,
        stats$: new BehaviorSubject(stats)
      });
    }
  }

  /**
   * Create a new social on the backend
   * and add it to the local cache.
   */
  create(attributes: SocialAttributes) {
    return from(SocialModel.create({ data: attributes })).pipe(
      catchError(() => {
        this.refreshStats();
        return EMPTY;
      }),
      tap(({ data }) => {
        if (data) {
          const { id } = data;
          const requestPayload = attributes;
          const newSocial = this.getSocialFromPayload(
            id, requestPayload
          );
          this.addToCache(newSocial);
        }
      })
    );
  }

  /**
   * Requests to delete the social on the backend,
   * then updates the local cache.
   *
   * @param params params of the social to delete
   */
  remove(params: SocialAttributes) {
    return from(SocialModel.remove({ data: params })).pipe(
      catchError(() => {
        this.refreshStats();
        return EMPTY;
      }),
      tap(({ data }) => {
        if (!data) {
          this.removeCachedAndStats(params.annotationId, data.id);
        }
      })
    );
  }

  getSocialFromPayload(id: string, payload: SocialAttributes): Social {
    const userId = this.userService.whoami().id;
    const created = new Date().toISOString();
    const newSocial = {
      ...payload, userId, created, changed: created, id
    };
    return newSocial;
  }

  clear() {
    this.socialCache = [];
    this.socialStatsByAnnotationId = [];
  }

  public getStatsByAnnotationId$(annotationId: string, parentId?: string): Observable<SocialStats> {
    const index = this.socialStatsByAnnotationId.findIndex(
      (s) => s.annotationId === annotationId && s.parentId === parentId
    );
    if (index > -1) {
      return this.socialStatsByAnnotationId[index].stats$;
    }

    const stats$ = new BehaviorSubject({
      totalLikes: 0,
      totalDislikes: 0,
      totalReports: 0,
      totalEndorses: 0,
      hasUserLike: false,
      hasUserDislike: false,
      hasUserReport: false,
      hasUserEndorse: false
    });
    this.socialStatsByAnnotationId.push({
      annotationId,
      parentId,
      stats$
    });
    return stats$;
  }
}
