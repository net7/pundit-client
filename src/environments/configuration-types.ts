import { AuthConfig } from 'src/app/login-module/public-api';

export type LocalConfig = {
    serializer: string;
    apiBaseUrl: string;
    authBaseUrl: string;
    userLink: string;
    notebookLink: string;
    notificationsLink: string;
    /** Ontologies page of the Pundit dashboard, linked from the empty Ontologies panel. */
    ontologiesLink?: string;
    /**
     * Maintenance status of the client (GET <APP_URL>/api/client-status). Optional: without it
     * the client reads no status and shows no maintenance notice. The extension's background
     * reads its own STATUS_URL build constant instead.
     */
    statusUrl?: string;
    userDefaultThumb: string;
    baseDereferenceURL: string;
    hypothesisLogo: string;
    unregisteredUserThumb: string;
    analytics: {
        mixpanel: {
          token: string;
          debug: boolean;
        };
    };
    auth: AuthConfig;
  };
