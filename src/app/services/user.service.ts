import { Injectable } from '@angular/core';
import { User } from '@pundit/communication';

type UserData = {
  id: string;
  username: string;
  thumb: string;
}

@Injectable()
export class UserService {
  private me: UserData;

  private users: UserData[] = [];

  public iam({ id, username, thumb }: UserData) {
    this.me = { id, username, thumb };
  }

  public whoami = () => this.me;

  load(rawUsers: User[]) {
    this.users = rawUsers.map(({ id, username, thumb }) => ({ id, username, thumb }));
  }

  getUserById(userId: string): UserData | null {
    return this.users.find(({ id }) => id === userId) || null;
  }
}
