import { AuthToken } from '../model';
import { RequestHooks } from '../types';

class ConfigurationSingleton {
  private static instance: ConfigurationSingleton;

  private _token!: AuthToken | null;

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

  public get token(): AuthToken | null {
    return this._token;
  }

  public set token(value: AuthToken | null) {
    this._token = value;
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
