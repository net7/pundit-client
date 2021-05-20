export type CrossMsgData = {
  messageId: string; // message id
  response?: any; // message response
  error?: any; // message error
}

export enum CrossMsgRequestId {
  TestGet = 'test.get',
  TestCreate = 'test.create',
  // notebook
  NotebookCreate = 'notebook.create',
  NotebookRemove = 'notebook.remove',
  NotebookSearch = 'notebook.search',
  NotebookUpdate = 'notebook.update',
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
