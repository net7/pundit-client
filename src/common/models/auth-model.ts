import { auth, retry$, UserLoginRequestParams } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';
import { environment as env } from '../../environments/environment';

export class AuthModel {
    static baseUrl = env.baseURL;

    @CrossMessage(CrossMsgRequestId.AuthLogin)
    static login(requestPayload: UserLoginRequestParams) {
      const baseURL = AuthModel.baseUrl;
      return auth.login({ baseURL, data: requestPayload });
    }

    @CrossMessage(CrossMsgRequestId.AuthLogout)
    static logout() {
      const baseURL = AuthModel.baseUrl;
      return auth.logout({ baseURL });
    }

    // @CrossMessage(CrossMsgRequestId.AuthRefresh)
    public static refresh() {
      const baseURL = AuthModel.baseUrl;
      return auth.refresh({ baseURL, data: null });
    }

    @CrossMessage(CrossMsgRequestId.AuthVerifyMail)
    public static verifyEmail() {
      const baseURL = AuthModel.baseUrl;
      return auth.verifyMail({ baseURL });
    }

    @CrossMessage(CrossMsgRequestId.AuthSso)
    static sso() {
      const baseURL = AuthModel.baseUrl;
      return auth.sso({ baseURL, data: null });
    }

    // @CrossMessage(CrossMsgRequestId.retry)
    public static retry(e) {
      return retry$(e);
    }
}
