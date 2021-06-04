export type CrossMsgData = {
  messageId: string; // message id
  response?: any; // message response
  error?: any; // message error
}

export enum CrossMsgRequestId {
  // notebook
  NotebookCreate = 'notebook.create',
  NotebookRemove = 'notebook.remove',
  NotebookSearch = 'notebook.search',
  NotebookUpdate = 'notebook.update',
  // annotation
  AnnotationCreate = 'annotation.create',
  AnnotationGet = 'annotation.get',
  AnnotationRemove = 'annotation.remove',
  AnnotationSearch = 'annotation.search',
  AnnotationUpdate = 'annotation.update',
  // social
  SocialCreate = 'social.create',
  SocialRemove = 'social.remove',
  SocialUpdate = 'social.update',
// auth
  AuthLogin = 'auth.login',
  AuthLogout = 'auth.logout',
  AuthVerifyMail = 'auth.verifyMail',
  AuthSso = 'auth.sso',
  AuthSignup = 'auth.signup'
}

export enum CommonEventType {
  AnnotationsUpdate = 'annotationsupdate',
  RootElementExists = 'rootelementexists',
  StorageRequest = 'storage.request',
  StorageResponse = 'storage.response',
  StateChanged = 'statechanged',
  CrossMsgRequest = 'crossmessage.request',
  CrossMsgResponse = 'crossmessage.response',
  PunditLoaded = 'punditloaded',
  PunditDestroy = 'punditdestroy',
  SetTokenFromStorage = 'settokenfromstorage',
  InitCommunicationSettings = 'initcommunicationsettings',
  ImageDataRequest = 'imagedata.request',
  ImageDataResponse = 'imagedata.response',
}

export enum StorageKey {
  User = 'pundit-user',
  Token = 'pundit-token',
  Notebook = 'pundit-notebook'
}

export enum StorageOperationType {
  Get = 'get',
  Set = 'set',
  Remove = 'remove'
}
