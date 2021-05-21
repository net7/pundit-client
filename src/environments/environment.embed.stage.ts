import local from './local.stage';

export const environment = {
  production: true,
  chromeExt: false,
  showLoginToast: false,
  ...local
};
