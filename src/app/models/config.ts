import { set as _set, get as _get } from 'lodash';

type ConfigurationData = {
  [key: string]: any;
};

class Config {
  private data: ConfigurationData = {};

  public init(data: ConfigurationData): void {
    this.data = data;
  }

  set(key: string, value: any): void {
    _set(this.data, key, value);
  }

  get(key: string): any {
    return _get(this.data, key);
  }
}

// exports
export const config = new Config();
// shortcut
export const _c: (key: string) => any = config.get.bind(config);
