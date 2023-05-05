/* eslint-disable @typescript-eslint/camelcase */

import { config } from './app/models/config';

const OVERRIDABLE_CONFIG_PARAMETERS = [
  'tagsHint'
];

const HOOKS = [
  'onLoad'
];

export const init = () => {
  // config api
  (window as any).Pundit_API = (window as any).Pundit_API || {};
  (window as any).Pundit_API.config = (hostConfig: {
        [key: string]: unknown;
      }) => {
    Object.keys(hostConfig).forEach((key) => {
      const value = hostConfig[key];
      if (OVERRIDABLE_CONFIG_PARAMETERS.includes(key)) {
        config.set(key, value);
      }
    });
  };

  // hooks
  HOOKS.forEach((hook) => {
    (window as any).Pundit_API[hook] = (window as any).Pundit_API[hook] || (() => null);
  });
};
