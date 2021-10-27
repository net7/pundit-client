import { LocalConfig } from './configuration-types';
import local from './local.stage';

const localConfig: LocalConfig = local;

export const environment = {
  production: true,
  chromeExt: false,
  showLoginToast: false,
  ...localConfig
};
