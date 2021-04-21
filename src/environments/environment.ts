import local from './local';

export const environment = {
  production: false,
  chromeExt: false,
  serializer: 'pundit-client',
  baseURL: 'https://4b0gec68z3.execute-api.eu-south-1.amazonaws.com',
  userLink: 'https://pundithomex.netseven.work/',
  notebookLink: 'https://pundithomex.netseven.work/notebook',
  ...local
};
