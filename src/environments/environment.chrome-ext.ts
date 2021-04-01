import local from './local';

export const environment = {
  production: true,
  chromeExt: true,
  serializer: 'pundit-client',
  baseURL: 'https://aw1qltfpxi.execute-api.eu-south-1.amazonaws.com/',
  userLink: 'https://app.thepund.it/',
  notebookLink: 'https://app.thepund.it/notebook',
  ...local
};
