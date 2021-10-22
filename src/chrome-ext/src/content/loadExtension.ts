import { badgeLoader, sendRootExistsMessage } from './helpers';
import { state } from './state';
import * as handlers from './handlers';
import { CommonEventType } from '../../../common/types';

export const listenersMap = {
  [CommonEventType.AnnotationsUpdate]: handlers.onAnnotationsUpdate,
  [CommonEventType.CrossMsgRequest]: handlers.onCrossMessageRequest,
  [CommonEventType.InitCommunicationSettings]: handlers.onInitCommunicationSettings,
  [CommonEventType.ImageDataRequest]: handlers.onImageDataRequest
};

export const loadExtension = () => {
  if (state.get('appRoot')) return;

  // existing embed pundit check
  if (document.querySelector('pnd-root')) {
    sendRootExistsMessage();
    return;
  }

  // add listeners
  Object.keys(listenersMap).forEach((type) => {
    const handler = listenersMap[type];
    window.addEventListener(type, handler, false);
  });

  const appRoot = document.createElement('pnd-root');
  document.body.appendChild(appRoot);
  state.set({ appRoot });

  const main = document.createElement('script');
  main.src = chrome.extension.getURL('pundit.chrome-ext.js');
  (document.head || document.documentElement).appendChild(main);
  main.onload = () => {
    // emit signal
    const signal = new CustomEvent(CommonEventType.PunditLoaded, {
      detail: { id: chrome.runtime.id }
    });
    window.dispatchEvent(signal);

    // loader interval
    const badgeInterval = setInterval(badgeLoader, 500);
    // init loader
    badgeLoader();
    // update state
    state.set({ badgeInterval });

    main.remove();
  };
};
