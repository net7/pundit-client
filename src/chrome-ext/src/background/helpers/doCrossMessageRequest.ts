import { CommonEventType, CrossMsgRequestId } from '../../../../common/types';
import { AnnotationModel, NotebookModel } from '../../../../common/models';

export const doCrossMessageRequest = (tab, payload) => {
  const { messageId, requestId, args } = payload;
  let request$;
  switch (requestId) {
    // NOTEBOOK REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.NotebookCreate:
      request$ = NotebookModel.create.apply(null, args);
      break;
    case CrossMsgRequestId.NotebookRemove:
      request$ = NotebookModel.remove.apply(null, args);
      break;
    case CrossMsgRequestId.NotebookSearch:
      request$ = NotebookModel.search.apply(null, args);
      break;
    case CrossMsgRequestId.NotebookUpdate:
      request$ = NotebookModel.update.apply(null, args);
      break;
    // ANNOTATION REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.AnnotationCreate:
      request$ = AnnotationModel.create.apply(null, args);
      break;
    case CrossMsgRequestId.AnnotationGet:
      request$ = AnnotationModel.get.apply(null, args);
      break;
    case CrossMsgRequestId.AnnotationRemove:
      request$ = AnnotationModel.remove.apply(null, args);
      break;
    case CrossMsgRequestId.AnnotationSearch:
      request$ = AnnotationModel.search.apply(null, args);
      break;
    case CrossMsgRequestId.AnnotationUpdate:
      request$ = AnnotationModel.update.apply(null, args);
      break;
    default:
      break;
  }
  if (request$) {
    request$
      .then((response) => {
        chrome.tabs.sendMessage(tab.id, {
          type: CommonEventType.CrossMsgResponse,
          payload: {
            response,
            messageId,
          }
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tab.id, {
          type: CommonEventType.CrossMsgResponse,
          payload: {
            error: {
              response: error.response
            },
            messageId,
          }
        });
      });
  }
};