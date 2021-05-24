import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LoginResponse } from '../interfaces';
@Injectable({
  providedIn: 'root'
})
export class AuthEventService {
  private event$ = new Subject<LoginResponse>();
  set = (value: LoginResponse) => {
    this.event$.next(value);
  }
  get = () => {
    return this.event$.asObservable();
  }
}
