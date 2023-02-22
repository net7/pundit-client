/* eslint-disable @typescript-eslint/camelcase */

import { AppEvent } from './app/event-types';
import { config } from './app/models/config';
import { hookManager } from './app/models/hook-manager';

declare let Pundit_API: {
  [key: string]: any;
};

const OVERRIDABLE_CONFIG_PARAMETERS = [
  'tagsHint',
];

const HOOKS = [
  'onLoad'
];

// method hooks
Pundit_API.on = (type, fn) => {
  hookManager.on(type, fn);
};

// manual update trigger
Pundit_API.refresh = () => {
  // emit signal
  const signal = new CustomEvent(AppEvent.PunditApiRefreshRequest, { detail: null });
  window.dispatchEvent(signal);
};

export const init = () => {
  // config api
  Pundit_API = Pundit_API || {};
  Pundit_API.config = (hostConfig: {
        [key: string]: unknown;
      }) => {
    Object.keys(hostConfig).forEach((key) => {
      const value = hostConfig[key];
      if (OVERRIDABLE_CONFIG_PARAMETERS.includes(key)) {
        config.set(key, value);
      }
    });
  };

  // initial hooks
  HOOKS.forEach((hook) => {
    Pundit_API[hook] = Pundit_API[hook] || (() => null);
  });
};
