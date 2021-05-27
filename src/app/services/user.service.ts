import { Injectable } from '@angular/core';
import { User } from '@pundit/communication';
import {
  BehaviorSubject, Observable, of, ReplaySubject
} from 'rxjs';
import { StorageKey } from '../../common/types';
import { StorageService } from './storage-service/storage.service';
import { _c } from '../models/config';

export type UserData = {
  id: string;
  username: string;
  thumb: string;
}

@Injectable()
export class UserService {
  public ready$: ReplaySubject<void> = new ReplaySubject();

  private me: UserData;

  private users: UserData[] = [];

  public logged$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private storageService: StorageService
  ) {
    this.storageService.get(StorageKey.User).subscribe((user: UserData) => {
      if (user) {
        this.iam(user, false);
      }
      // emit signal
      this.ready$.next();
    });
  }

  public iam({ id, username, thumb }: UserData, sync = true) {
    this.add({ id, username, thumb });
    this.me = this.getUserById(id);
    let source$: Observable<boolean> = of(true);
    // storage sync
    if (sync) {
      source$ = this.storageService.set(StorageKey.User, this.me);
    }

    source$.subscribe(() => {
      // emit signal
      this.logged$.next(true);
    });
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
    }
  }

  getUserById(userId: string): UserData | null {
    return this.users.find(({ id }) => id === userId) || null;
  }

  logout() {
    this.logged$.next(false);

    // storage sync
    this.storageService.remove(StorageKey.User).subscribe(() => {
      // do nothing
    });
  }

  clear() {
    this.users = [];
    this.me = null;
  }
}
