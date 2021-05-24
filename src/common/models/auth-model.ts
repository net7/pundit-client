import { auth, UserLoginRequestParams } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class AuthModel {
  @CrossMessage(CrossMsgRequestId.AuthLogin)
  static login(requestPayload: UserLoginRequestParams) {
    return auth.login(requestPayload);
  }

  @CrossMessage(CrossMsgRequestId.AuthLogout)
  static logout() {
    return auth.logout();
  }

  @CrossMessage(CrossMsgRequestId.AuthVerifyMail)
  public static verifyEmail() {
    return auth.verifyMail();
  }

  @CrossMessage(CrossMsgRequestId.AuthSso)
  static sso() {
    return auth.sso();
  }
}
