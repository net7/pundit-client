import { CommonEventType, CrossMsgRequestId } from '../../../../common/types';
import { TestModel, NotebookModel } from '../../../../common/models';

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
    // TEST REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.TestGet:
      request$ = TestModel.get.apply(null, args);
      break;
    case CrossMsgRequestId.TestCreate:
      request$ = TestModel.create.apply(null, args);
      break;
    default:
      break;
  }
  if (request$) {
    request$
      .then((data) => {
        if (data.json) {
          return data.json();
        }
        return data;
      })
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
