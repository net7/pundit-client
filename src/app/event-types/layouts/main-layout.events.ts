/**
 * Main layout events
 *
 * Components should listen for these events, while layouts should listen for AppEvents instead.
 */
export enum MainLayoutEvent {
  AnnotationDeleteClick = 'main-layout.annotationdeleteclick',
  AnnotationCreated = 'main-layout.annotationcreated',
  Init = 'main-layout.init',
  Destroy = 'main-layout.destroy',
  GetPublicData = 'main-layout.getpublicdata',
  GetUserData = 'main-layout.getuserdata',
  KeyUpEscape = 'main-layout.keyupescape',
  SelectionChange = 'main-layout.selectionchange',
  UpdateNotebookSelect = 'main-layout.updatenotebookselect',
  ClickTooltip = 'main-layout.clicktooltip',
  IdentityLogin = 'main-layout.identitylogin',
  IdentitySync = 'main-layout.identitysync',
  NotebookShareAutocompleteResponse = 'main-layout.notebookshareautocompleteresponse',
}
