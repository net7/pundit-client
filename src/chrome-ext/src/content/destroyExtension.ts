import { state } from './state';
import * as handlers from './handlers';
import { CommonEventType } from '../../../common/types';

export const destroyExtension = () => {
  if (!state.get('appRoot')) return;

  // remove listeners
  window.removeEventListener(CommonEventType.AnnotationsUpdate, handlers.onAnnotationsUpdate);
  window.removeEventListener(CommonEventType.StorageRequest, handlers.onStorageRequest);
  window.removeEventListener(CommonEventType.CrossMsgRequest, handlers.onCrossMessageRequest);
  window.removeEventListener(
    CommonEventType.InitCommunicationSettings,
    handlers.onInitCommunicationSettings
  );
  window.removeEventListener(
    CommonEventType.SetTokenFromStorage,
    handlers.onSetTokenFromStorage
  );
  window.removeEventListener(
    CommonEventType.ImageDataRequest,
    handlers.onImageDataRequest
  );

  // emit signal
  const signal = new CustomEvent(CommonEventType.PunditDestroy);
  window.dispatchEvent(signal);

  // clear
  const badgeInterval = state.get('badgeInterval');
  const appRoot = state.get('appRoot');
  clearInterval(badgeInterval);
  appRoot.remove();
  // update state
  state.set({ badgeIntervalCount: 0, appRoot: null });
};
