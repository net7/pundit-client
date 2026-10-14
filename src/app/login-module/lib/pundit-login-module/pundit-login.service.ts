import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse } from 'src/communication';
import { ModalService, AuthEventService } from '../services';
import { AuthModel } from '../../../../common/models';
import { responseTransformer } from '../helpers/transformer.helper';

@Injectable({
  providedIn: 'root'
})
export class PunditLoginService {
  private modalService = inject(ModalService);
  private authEventService = inject(AuthEventService);


  start(isRegister = false) {
    this.modalService.open(isRegister);
  }

  stop() {
    this.modalService.close();
  }

  onAuth = (): Observable<LoginResponse> => this.authEventService.get();

  logout() {
    return AuthModel.logout();
  }

  sso() {
    return responseTransformer(AuthModel.sso(), 'sso');
  }
}
