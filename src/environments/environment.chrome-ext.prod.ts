import { LocalConfig } from './configuration-types';
import local from './local.prod';

const localConfig: LocalConfig = local;

export const environment = {
  production: true,
  chromeExt: true,
  showLoginToast: true,
  ...localConfig
};
