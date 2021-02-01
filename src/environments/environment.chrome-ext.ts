import local from './local';

export const environment = {
  production: false,
  chromeExt: true,
  serializer: 'pundit-client',
  baseURL: 'https://4b0gec68z3.execute-api.eu-south-1.amazonaws.com',
  ...local
};
