export type CrossMessage = {
  messageId: string; // message id
  data?: any; // message data
  error?: any; // message error
}

export enum CrossMessageRequestId {
  TestGet = 'test.get',
  TestCreate = 'test.create'
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
  PunditDestroy = 'punditdestroy'
}
