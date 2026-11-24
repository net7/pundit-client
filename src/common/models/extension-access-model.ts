import { environment as env } from '../../environments/environment';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

/**
 * The application's site, where the BE API lives. Read from the build
 * environment: on web pages the extension's page script does not set
 * `CommunicationSettings`, it hands the URLs to the background.
 */
const apiUrl = (): URL | null => {
  try {
    return new URL(env.authBaseUrl);
  } catch {
    return null;
  }
};

/** Origin pattern of the application's site. */
const apiOrigins = (): string[] | null => {
  const url = apiUrl();
  return url ? [`${url.origin}/*`] : null;
};

/**
 * The extension's access to the application's site. The user can withhold it
 * (site access "On click" or "On specific sites"); then every BE API call of
 * the extension is refused by CORS.
 *
 * Both methods are cross-message requests: in the extension's own pages (the
 * PDF viewer) they run in the page, on web pages in the background.
 */
export class ExtensionAccessModel {
  /** Whether the extension can reach the application's site; true outside the extension. */
  @CrossMessage(CrossMsgRequestId.ExtensionHasApiAccess)
  static hasApiAccess(): Promise<boolean> {
    const permissions = (globalThis as { chrome?: typeof chrome }).chrome?.permissions;
    const origins = apiOrigins();
    if (typeof permissions?.contains !== 'function' || !origins) {
      return Promise.resolve(true);
    }
    return permissions.contains({ origins }).catch(() => true);
  }

  /**
   * Asks the browser for access to the application's site and reloads the
   * page once it is granted. In an extension page it must run in the user's
   * click; on a web page the background opens an extension window instead.
   */
  @CrossMessage(CrossMsgRequestId.ExtensionRequestApiAccess)
  static requestApiAccess(): Promise<boolean> {
    const permissions = (globalThis as { chrome?: typeof chrome }).chrome?.permissions;
    const origins = apiOrigins();
    if (typeof permissions?.request !== 'function' || !origins) {
      return Promise.resolve(false);
    }
    return permissions.request({ origins }).then((granted) => {
      if (granted) {
        window.location.reload();
      }
      return granted;
    }, () => false);
  }
}
