import { AuthConfig } from 'src/app/login-module/public-api';

export type LocalConfig = {
    serializer: string;
    apiBaseUrl: string;
    authBaseUrl: string;
    userLink: string;
    notebookLink: string;
    notificationsLink: string;
    userDefaultThumb: string;
    baseDereferenceURL: string;
    analytics: {
        mixpanel: {
          token: string;
          debug: boolean;
        };
    };
    auth: AuthConfig;
  };
