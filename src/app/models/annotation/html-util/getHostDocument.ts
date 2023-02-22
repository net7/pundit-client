import { PunditApiHook } from 'src/common/types';
import { hookManager } from '../../hook-manager';

export function getHostDocument() {
  const context = {
    document: null
  };
  hookManager.trigger(PunditApiHook.HostGetDocument, context, () => {
    context.document = document;
  });
  return context.document;
}
