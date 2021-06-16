import local from './local.stage';

export const environment = {
  production: false,
  chromeExt: false,
  showLoginToast: true,
  ...local,
};
