import { RequestHooks } from '../types';

class ConfigurationSingleton {
  private static instance: ConfigurationSingleton;

  /** Latest CSRF token received for the current session, sent as `X-CSRF-TOKEN`. */
  private _csrfToken: string | null = null;

  private _authBaseUrl!: string;

  private _apiBaseUrl!: string;

  private _hooks!: RequestHooks;

  private constructor() { }

  public static getInstance(): ConfigurationSingleton {
    if (!ConfigurationSingleton.instance) {
      ConfigurationSingleton.instance = new ConfigurationSingleton();
    }

    return ConfigurationSingleton.instance;
  }

  public get csrfToken(): string | null {
    return this._csrfToken;
  }

  public set csrfToken(value: string | null) {
    this._csrfToken = value;
  }

  public get hooks(): RequestHooks {
    return this._hooks;
  }

  public set hooks(value: RequestHooks) {
    this._hooks = value;
  }

  public get authBaseUrl(): string {
    return this._authBaseUrl;
  }

  public set authBaseUrl(value: string) {
    this._authBaseUrl = value;
  }

  public get apiBaseUrl(): string {
    return this._apiBaseUrl;
  }

  public set apiBaseUrl(value: string) {
    this._apiBaseUrl = value;
  }
}
export const CommunicationSettings = ConfigurationSingleton.getInstance();
