import { badgeLoader, sendRootExistsMessage } from './helpers';
import { state } from './state';
import * as handlers from './handlers';
import { EventType } from '../types';

export const loadExtension = () => {
  if (state.get('appRoot')) return;

  // existing embed pundit check
  if (document.querySelector('pnd-root')) {
    sendRootExistsMessage();
    return;
  }

  // listen to annotation updates
  window.addEventListener(EventType.AnnotationsUpdate, handlers.onAnnotationsUpdate, false);
  // listen storage request event
  window.addEventListener(EventType.StorageRequest, handlers.onStorageRequest, false);

  const appRoot = document.createElement('pnd-root');
  document.body.appendChild(appRoot);
  state.set({ appRoot });

  const main = document.createElement('script');
  main.type = 'module';
  main.src = chrome.extension.getURL('pundit.chrome-ext.js');
  (document.head || document.documentElement).appendChild(main);
  main.onload = () => {
    // emit signal
    const signal = new CustomEvent('punditloaded', {
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
