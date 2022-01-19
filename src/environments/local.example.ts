import { AuthConfig } from 'src/app/login-module/public-api';
import { LocalConfig } from './configuration-types';

const FACEBOOK_CLIENT_ID = '';
const GOOGLE_CLIENT_ID = '';
const EGI_CLIENT_ID = '';
const REDIRECT_URI_EGI = '';
const REDIRECT_URI_GOOGLE = '';
const REDIRECT_URI_FACEBOOK = '';
const GOOGLE_URL = '';
const FACEBOOK_URL = '';
const EGI_URL = '';
const POPUP_ORIGIN = '';
const TERMS_URL = '';

const config: LocalConfig = {
  serializer: 'pundit-client',
  apiBaseUrl: 'https://api.pundit.work/',
  authBaseUrl: 'https://pundit.work/',
  userLink: 'https://pundit.work/',
  notebookLink: 'https://pundit.work/notebook',
  notificationsLink: 'https://pundit.work/notifications',
  userDefaultThumb: 'https://static.pundit.work/user-thumb-default.png',
  baseDereferenceURL: '<dereference-url>',
  analytics: {
    mixpanel: {
      token: '123456879a54a6sd4a65d4',
      debug: false
    }
  },
  auth: {
    oauthproviders: [
      {
        id: 'google',
        type: 'OAuth',
        params: {
          clientId: GOOGLE_CLIENT_ID,
          redirect: REDIRECT_URI_GOOGLE,
          url: GOOGLE_URL,
          scope: 'openid profile email'
        },
        popup: {
          origin: POPUP_ORIGIN,
        }
      },
      {
        id: 'facebook',
        type: 'OAuth',
        params: {
          clientId: FACEBOOK_CLIENT_ID,
          redirect: REDIRECT_URI_FACEBOOK,
          url: FACEBOOK_URL,
          scope: 'email'
        },
        popup: {
          origin: POPUP_ORIGIN,
          size: { height: '600', width: '400' }
        }
      },
      {
        id: 'egi',
        type: 'OAuth',
        params: {
          clientId: EGI_CLIENT_ID,
          redirect: REDIRECT_URI_EGI,
          url: EGI_URL,
          scope: 'openid profile email'
        },
        popup: {
          origin: POPUP_ORIGIN,
        }
      }
    ],
    email: {
      id: 'default',
      register: true,
      type: 'email'
    },
    terms: {
      url: TERMS_URL,
      popup: {
        origin: POPUP_ORIGIN
      }
    }
  } as AuthConfig
};

export default config;
