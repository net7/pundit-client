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

  public getMe = () => this.me;

  // FIXME: mettere type definitivi
  setMe({ id, username, thumb }: any) {
    this.me = { id, username, thumb };
  }

  load(rawUsers: any[]) {
    this.users = rawUsers.map(({ id, username, thumb }) => ({ id, username, thumb }));
  }

  getUserById(userId: string): User | null {
    return this.users.find(({ id }) => id === userId) || null;
  }
}
