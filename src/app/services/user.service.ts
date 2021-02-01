import { Injectable } from '@angular/core';
import { User } from '@pundit/communication';
import { BehaviorSubject } from 'rxjs';
import { environment as env } from '../../environments/environment';

type UserData = {
  id: string;
  username: string;
  thumb: string;
}

@Injectable()
export class UserService {
  private me: UserData;

  private token: string;

  private users: UserData[] = [];

  public logged$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor() {
    if (!env.chromeExt) {
      this.setUserFromMemory();
    }
  }

  public iam({ id, username, thumb }: UserData) {
    this.me = { id, username, thumb };
  }

  public setToken(token: string) {
    this.token = token;
  }

  public getToken = () => this.token;

  public whoami = () => this.me;

  load(rawUsers: User[]) {
    this.users = rawUsers.map(({ id, username, thumb }) => ({ id, username, thumb }));
  }

  getUserById(userId: string): UserData | null {
    return this.users.find(({ id }) => id === userId) || null;
  }

  login() {
    this.logged$.next(true);

    if (!env.chromeExt) {
      this.saveUserInMemory();
    }
  }

  logout() {
    this.logged$.next(false);

    if (!env.chromeExt) {
      this.removeUserFromMemory();
    }
  }

  private setUserFromMemory() {
    const user = localStorage.getItem('pundit-user');
    const token = localStorage.getItem('pundit-token');
    if (user && token) {
      this.iam(JSON.parse(user));
      this.setToken(token);
      this.logged$.next(true);
    }
  }

  private saveUserInMemory() {
    localStorage.setItem('pundit-user', JSON.stringify(this.whoami()));
    localStorage.setItem('pundit-token', this.getToken());
  }

  private removeUserFromMemory() {
    localStorage.removeItem('pundit-user');
    localStorage.removeItem('pundit-token');
  }
}
