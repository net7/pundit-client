import { LocalConfig } from './configuration-types';
import local from './local.stage';

const localConfig: LocalConfig = local;

export const environment = {
  production: false,
  chromeExt: false,
  showLoginToast: true,
  ...localConfig,
};
