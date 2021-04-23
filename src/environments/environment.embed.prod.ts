import local from './local.prod';

export const environment = {
  production: true,
  chromeExt: false,
  ...local
};
