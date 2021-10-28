import { LocalConfig } from './configuration-types';
import local from './local.stage';

const localConfig: LocalConfig = local;

export const environment = {
  production: true,
  chromeExt: true,
  showLoginToast: true,
  ...localConfig
};
