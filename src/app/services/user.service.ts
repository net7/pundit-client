import { Injectable } from '@angular/core';
import { User } from '@pundit/communication';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { StorageKey } from './storage-service/storage.types';
import { StorageService } from './storage-service/storage.service';

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
    private storage: StorageService
  ) {
    this.storage.get(StorageKey.User).subscribe((user: UserData) => {
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

    // storage sync
    if (sync) {
      this.storage.set(StorageKey.User, this.me);
    }

    // emit signal
    this.logged$.next(true);
  }

  public whoami = () => this.me;

  load(rawUsers: User[]) {
    rawUsers.forEach(({ id, username, thumb }) => {
      this.add({
        id,
        username,
        thumb: thumb || 'https://static.thepund.it/assets/img/user-thumb-default.png'
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
    this.storage.remove(StorageKey.User);
  }

  clear() {
    this.users = [];
    this.me = null;
  }
}
