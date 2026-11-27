import { AuthConfig } from 'src/app/login-module/public-api';
import { LocalConfig } from './configuration-types';

// the application: the BE API lives under its /api, social sign-in starts at its login/<provider>/pundit
const AUTH_BASE_URL = 'https://pundit.work/';
const POPUP_ORIGIN = '';
const TERMS_URL = '';

const config: LocalConfig = {
  serializer: 'pundit-client',
  // one host: the BE API lives under the application's /api
  apiBaseUrl: 'https://pundit.work/api',
  authBaseUrl: AUTH_BASE_URL,
  userLink: 'https://pundit.work/',
  notebookLink: 'https://pundit.work/notebook',
  notificationsLink: 'https://pundit.work/notifications',
  ontologiesLink: 'https://pundit.work/ontologies',
  statusUrl: 'https://pundit.work/api/client-status',
  userDefaultThumb: 'https://static.pundit.work/user-thumb-default.png',
  hypothesisLogo: '',
  unregisteredUserThumb: '',
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
          url: `${AUTH_BASE_URL}login/google/pundit`,
        },
        popup: {
          origin: POPUP_ORIGIN,
        }
      },
      {
        id: 'facebook',
        type: 'OAuth',
        params: {
          url: `${AUTH_BASE_URL}login/facebook/pundit`,
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
          url: `${AUTH_BASE_URL}login/egi/pundit`,
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
