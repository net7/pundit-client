import { AuthConfig } from '@pundit/login';

const FACEBOOK_CLIENT_ID = '';
const GOOGLE_CLIENT_ID = '';
const EGI_CLIENT_ID = '';
const REDIRECT_URI_EGI = '';
const REDIRECT_URI_GOOGLE = '';
const REDIRECT_URI_FACEBOOK = '';
const GOOGLE_URL = '';
const FACEBOOK_URL = '';
const EGI_URL = '';
// const EMAIL_URL = '';
const POPUP_ORIGIN = '';

export default {
  auth: {
    oauthproviders: [
      {
        id: 'google',
        type: 'OAuth',
        popupOrigin: POPUP_ORIGIN,
        params: {
          clientId: GOOGLE_CLIENT_ID,
          redirect: REDIRECT_URI_GOOGLE,
          url: GOOGLE_URL,
          scope: 'openid profile email'
        }
      },
      {
        id: 'facebook',
        type: 'OAuth',
        popupOrigin: POPUP_ORIGIN,
        params: {
          clientId: FACEBOOK_CLIENT_ID,
          redirect: REDIRECT_URI_FACEBOOK,
          url: FACEBOOK_URL,
          scope: 'email'
        }
      },
      {
        id: 'egi',
        type: 'OAuth',
        popupOrigin: POPUP_ORIGIN,
        params: {
          clientId: EGI_CLIENT_ID,
          redirect: REDIRECT_URI_EGI,
          url: EGI_URL,
          scope: 'openid profile email'
        }
      }
    ],
    // email: {
    //   id: 'default',
    //   params: {
    //     register: false,
    //     url: EMAIL_URL
    //   },
    //   type: 'email'
    // }
  } as AuthConfig
};
