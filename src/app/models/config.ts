import { set as _set, get as _get } from 'lodash';

type ConfigurationDataItem = string
  | number
  | boolean
  | object
  | null
  | ConfigurationDataItem[];

type ConfigurationData = {
  [key: string]: ConfigurationDataItem;
};

class Config {
  private data: ConfigurationData = {};

  public init(data: ConfigurationData): void {
    this.data = data;
  }

  set(key: string, value: ConfigurationDataItem): void {
    _set(this.data, key, value);
  }

  get(key: string): ConfigurationDataItem {
    return _get(this.data, key);
  }
}

// exports
export const config = new Config();
// shortcut
export const _c: (key: string) => ConfigurationDataItem = config.get.bind(config);
