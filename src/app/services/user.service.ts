import { Injectable } from '@angular/core';
import { User } from '@pundit/communication';
import { BehaviorSubject } from 'rxjs';
import { AnalyticsModel } from 'src/common/models';
import { _c } from '../models/config';
import { ImageDataService } from './image-data.service';

export type UserData = {
  id: string;
  username: string;
  thumb: string;
}

@Injectable()
export class UserService {
  private me: UserData;

  private users: UserData[] = [];

  public logged$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public dashboardNotifications$: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(
    private imageDataService: ImageDataService,
  ) {}

  public iam({ id, username, thumb }: UserData) {
    this.add({ id, username, thumb });
    this.me = this.getUserById(id);

    // set analytics user
    AnalyticsModel.userId = id;

    // emit signal
    this.logged$.next(true);
  }

  public whoami = () => this.me;

  load(rawUsers: User[]) {
    rawUsers.forEach(({ id, username, thumb }) => {
      this.add({
        id,
        username,
        thumb: thumb || _c('userDefaultThumb')
      });
    });
  }

  add(user: UserData) {
    if (!this.getUserById(user.id)) {
      this.users.push(user);

      // add to image service
      this.imageDataService.add(user.thumb || _c('userDefaultThumb'));
    }
  }

  getUserById(userId: string): UserData | null {
    return this.users.find(({ id }) => id === userId) || null;
  }

  logout() {
    this.logged$.next(false);
    this.dashboardNotifications$.next(0);
  }

  clear() {
    this.users = [];
    this.me = null;

    // remove analytics user
    AnalyticsModel.userId = null;
  }
}
