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
  // reply
  ReplyCreate = 'reply.create',
  ReplyRemove = 'reply.remove',
  ReplyUpdate = 'reply.update',
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
  SemanticObjectSearch = 'semanticobject.search',
}

export enum CommonEventType {
  AnnotationsUpdate = 'annotationsupdate',
  RootElementExists = 'rootelementexists',
  StateChanged = 'statechanged',
  CrossMsgRequest = 'crossmessage.request',
  CrossMsgResponse = 'crossmessage.response',
  PunditLoaded = 'punditloaded',
  PunditDestroy = 'punditdestroy',
  InitCommunicationSettings = 'initcommunicationsettings',
  ImageDataRequest = 'imagedata.request',
  ImageDataResponse = 'imagedata.response',
  DocumentInfoRequest = 'documentinfo.request',
  DocumentInfoResponse = 'documentinfo.response',
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
  // social
  SocialLike = 'social-like',
  SocialDislike = 'social-dislike',
  SocialReport = 'social-report',
  SocialComment = 'social-comment',
}
