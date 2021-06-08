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
  // auth
  AuthLogin = 'auth.login',
  AuthLogout = 'auth.logout',
  AuthVerifyMail = 'auth.verifyMail',
  AuthSso = 'auth.sso',
  AuthSignup = 'auth.signup',
  // analytics
  AnalyticsTrigger = 'analytics.trigger'
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

export type AnalyticsData = {
  action: AnalyticsAction;
  payload?: object;
}

export enum AnalyticsAction {
  Bootstrap = 'bootstrap',
  HighlightCreated = 'new-highlight',
  CommentCreated = 'new-comment',
  NotebookCreated = 'notebook-new-created',
  NotebookCurrentChanged = 'notebook-switch-current',
  NotebookVisibilityChanged = 'notebook-switch-visibility',
  LoginButtonClicked = 'login-button-click',
  LoginSubmitted = 'login-submit',
  RegisterButtonClicked = 'register-button-click',
  RegisterFormFieldsCompleted = 'register-text-fields-filled',
  RegisterCheck1Filled = 'register-check-1-filled',
  RegisterCheck2Filled = 'register-check-2-filled',
  RegisterWithGoogleClicked = 'register-with-google-click',
  RegisterWithFacebookClicked = 'register-with-facebook-click',
  RegisterWithEgiClicked = 'register-with-egi-click',
  RegistrationCompleted = 'register-completed',
}
