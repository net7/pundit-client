import { environment as env } from 'src/environments/environment';
import { config } from '../models/config';
import packageJson from '../../../package.json';

const isExtensionPage = () => typeof document !== 'undefined'
  && document.location?.protocol === 'chrome-extension:';

/**
 * Version of this client, compared with the maintenance notice's `maxClientVersion`.
 *
 * - extension pages (PDF viewer): the installed manifest;
 * - extension on a web page: the manifest version the content script sent with PunditLoaded;
 * - other builds (embed, standalone viewers): package.json.
 *
 * package.json is not used in the extension: on stage it still holds the last prod version.
 * Returns null when the extension's version is not known.
 */
export const getClientVersion = (): string | null => {
  if (isExtensionPage() && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    return chrome.runtime.getManifest().version;
  }
  if (env.chromeExt) {
    return config.get('clientVersion') || null;
  }
  return packageJson.version;
};
