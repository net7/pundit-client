import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

/** The status request is aborted after this delay. */
export const CLIENT_STATUS_TIMEOUT = 3000;

/**
 * The maintenance status of the client (GET <APP_URL>/api/client-status).
 *
 * In the extension on a web page the call goes to the background service worker, which reads
 * its own STATUS_URL and ignores the URL sent by the page. Elsewhere it runs in place.
 */
export class ClientStatusModel {
  /**
   * The JSON of the status, or null when it cannot be read (no URL, network error, timeout,
   * HTTP error, invalid JSON). Never rejects. The request carries no cookie, no credential,
   * no referrer, and skips the browser cache.
   */
  @CrossMessage(CrossMsgRequestId.ClientStatusGet)
  static async get(url?: string | null): Promise<unknown> {
    if (!url) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_STATUS_TIMEOUT);
    try {
      const separator = url.includes('?') ? '&' : '?';
      const response = await fetch(`${url}${separator}_=${Date.now()}`, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
