import { PunditApiHook } from 'src/common/types';
import { hookManager } from '../../hook-manager';

export function getHostDocumentBody() {
  const context = {
    body: null
  };
  hookManager.trigger(PunditApiHook.HostGetDocumentBody, context, () => {
    context.body = document.body;
  });
  return context.body;
}
