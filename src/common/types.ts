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
  NotebookSetDefault = 'notebook.setDefault',
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
  AuthSignup = 'auth.signup',
  // analytics
  AnalyticsTrigger = 'analytics.trigger',
  // tag
  TagGet = 'tag.get',
  // semantic
  SemanticPredicateGet = 'semanticpredicate.get',
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
  Token = 'pundit-token'
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
  // annotation
  HighlightAnnotationCreated = 'new-highlight',
  CommentAnnotationCreated = 'new-comment',
  SemanticAnnotationCreated = 'new-semantic',
  TagAnnotationCreated = 'new-tag',
  // notebook
  NotebookCreated = 'notebook-new-created',
  NotebookCurrentChanged = 'notebook-switch-current',
  NotebookVisibilityChanged = 'notebook-switch-visibility',
  // anchoring
  AnnotationAnchoringSuccess = 'anchoring-success',
  AnnotationAnchoringError = 'anchoring-error',
  // login
  LoginButtonClick = 'login-button-click',
  LoginGoogleClick = 'login-google-click',
  LoginFacebookClick = 'login-facebook-click',
  LoginEgiClick = 'login-egi-click',
  LoginEmailClick = 'login-email-click',
  LoginEmailCompleted = 'login-email-completed',
  // register
  RegisterButtonClick = 'register-button-click',
  RegisterFormFieldsCompleted = 'register-text-fields-filled',
  RegisterCheck1Filled = 'register-check-1-filled',
  RegisterCheck2Filled = 'register-check-2-filled',
  RegisterEmailClick = 'register-email-click',
  RegisterEmailCompleted = 'register-email-completed',
  RegisterGoogleClick = 'register-google-click',
  RegisterFacebookClick = 'register-facebook-click',
  RegisterEgiClick = 'register-with-egi-click',
  // oauth access
  AccessGoogleCompleted = 'access-google-completed',
  AccessFacebookCompleted = 'access-facebook-completed',
  AccessEgiCompleted = 'access-egi-completed',
}
