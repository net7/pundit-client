import local from './local.prod';

export const environment = {
  production: true,
  chromeExt: true,
  showLoginToast: true,
  ...local
};
