import { Injectable } from '@angular/core';
import { LoginResponse } from 'src/communication';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthEventService {
  private event$ = new Subject<LoginResponse>();

  set = (value: LoginResponse) => {
    this.event$.next(value);
  };

  get = () => this.event$.asObservable();
}
