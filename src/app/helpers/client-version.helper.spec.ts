import { environment as env } from 'src/environments/environment';
import { config } from '../models/config';
import packageJson from '../../../package.json';
import { getClientVersion } from './client-version.helper';

describe('getClientVersion', () => {
  const { chromeExt } = env;

  afterEach(() => {
    (env as { chromeExt: boolean }).chromeExt = chromeExt;
    config.set('clientVersion', undefined);
  });

  it('returns the package.json version outside the extension', () => {
    (env as { chromeExt: boolean }).chromeExt = false;
    expect(getClientVersion()).toBe(packageJson.version);
  });

  it('returns the version sent by the content script in the extension', () => {
    (env as { chromeExt: boolean }).chromeExt = true;
    config.set('clientVersion', '1.18.0.1');
    expect(getClientVersion()).toBe('1.18.0.1');
  });

  it('returns null in the extension before the version is known', () => {
    (env as { chromeExt: boolean }).chromeExt = true;
    expect(getClientVersion()).toBeNull();
  });
});
