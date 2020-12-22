import { Injectable } from '@angular/core';

type User = {
  id: string;
  username: string;
  thumb: string;
}

@Injectable()
export class UserService {
  private me: User;

  private users: User[] = [];

  // FIXME: mettere type definitivi
  public iam({ id, username, thumb }: User) {
    this.me = { id, username, thumb };
  }

  public whoami = () => this.me;

  load(rawUsers: any[]) {
    this.users = rawUsers.map(({ id, username, thumb }) => ({ id, username, thumb }));
  }

  getUserById(userId: string): User | null {
    return this.users.find(({ id }) => id === userId) || null;
  }
}
