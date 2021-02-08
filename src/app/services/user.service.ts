import { Injectable } from '@angular/core';
import { User } from '@pundit/communication';
import { BehaviorSubject } from 'rxjs';
import { StorageSyncKey, StorageSyncService } from './storage-sync.service';

type UserData = {
  id: string;
  username: string;
  thumb: string;
}

@Injectable()
export class UserService {
  private me: UserData;

  private users: UserData[] = [];

  public logged$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private storage: StorageSyncService
  ) {
    const user = this.storage.get(StorageSyncKey.User);
    if (user) {
      this.iam(JSON.parse(user), false);
    }
  }

  public iam({ id, username, thumb }: UserData, sync = true) {
    this.add({ id, username, thumb });
    this.me = this.getUserById(id);

    // storage sync
    if (sync) {
      this.storage.set(StorageSyncKey.User, JSON.stringify(this.me));
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
    this.storage.remove(StorageSyncKey.User);
  }

  clear() {
    this.users = [];
  }
}
