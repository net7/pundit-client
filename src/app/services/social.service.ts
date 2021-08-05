import { Injectable } from '@angular/core';
import { Social, SocialAttributes } from '@pundit/communication';
import { from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SocialModel } from '../../common/models';
import { UserService } from './user.service';

@Injectable()
export class SocialService {
  private socials: Social[] = [];

  constructor(
    private userService: UserService
  ) { }

  load(rawSocials: Social[]) {
    rawSocials.forEach((rawSocial) => {
      this.add(rawSocial);
    });
  }

  /**
   * Create a new social on the backend
   * and add it to the local cache.
   */
  create(attributes: SocialAttributes) {
    return from(SocialModel.create({ data: attributes })).pipe(
      tap(({ data }) => {
        const { id } = data;
        const requestPayload = attributes;
        const newSocial = this.getSocialFromPayload(
          id, requestPayload
        );
        this.add(newSocial);
      })
    );
  }

  /**
   * Load a social that already exists into the client
   * @param rawSocial
   */
  add(rawSocial: Social) {
    const index = this.socials.map(({ id }) => id).indexOf(rawSocial.id);
    // if annotation exists update auth related info
    if (index > -1) {
      this.socials[index] = rawSocial;
    } else {
      this.socials.push(rawSocial);
    }
  }

  /**
   * Update a cached social.
   * To change the data on the backend use "../models/social/update" instead!
   * @param socialId id of the social to update
   * @param data data of the social that you want to change
   */
  update(socialId: string, data: SocialAttributes) {
    return from(SocialModel.update(socialId, { data }))
      .pipe(
        tap(() => {
          const index = this.socials.map(({ id }) => id).indexOf(socialId);
          if (index <= -1) {
            console.warn('Social update fail');
            return;
          }
          const updatedSocial = this.getSocialFromPayload(socialId, data);
          const { created } = this.socials[index];
          this.socials[index] = { ...updatedSocial, created };
        })
      );
  }

  updateCached

  /**
   * Requests to delete the social on the backend,
   * then updates the local cache.
   *
   * @param socialId ID of the social to delete
   */
  remove(socialId: string) {
    return from(SocialModel.remove(socialId)).pipe(
      tap(() => {
        this.removeCached(socialId);
      })
    );
  }

  removeCached(socialId: string) {
    const index = this.socials.map(({ id }) => id).indexOf(socialId);
    this.socials.splice(index, 1);
  }

  getSocialById(socialId: string): Social | null {
    return this.socials.find(({ id }) => id === socialId) || null;
  }

  getSocials() {
    return this.socials.sort((a, b) => {
      const aCreated = a.created;
      const bCreated = b.created;
      return new Date(aCreated).getTime() - new Date(bCreated).getTime();
    });
  }

  getSocialsByAnnotationId(id: string): Social[] {
    return this.getSocials().filter(({ annotationId }) => annotationId === id);
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
    this.socials = [];
  }
}
