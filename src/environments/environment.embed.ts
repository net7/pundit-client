import local from './local';

export const environment = {
  production: false,
  chromeExt: false,
  serializer: 'pundit-client',
  baseURL: 'https://aw1qltfpxi.execute-api.eu-south-1.amazonaws.com/',
  ...local
};
