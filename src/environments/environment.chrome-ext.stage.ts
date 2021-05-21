import local from './local.stage';

export const environment = {
  production: true,
  chromeExt: true,
  showLoginToast: true,
  ...local
};
