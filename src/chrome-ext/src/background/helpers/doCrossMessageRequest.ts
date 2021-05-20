import { CommonEventType, CrossMessageRequestId } from '../../../../common/types';
import { TestModel } from '../../../../common/models/test-model';

export const doCrossMessageRequest = (tab, payload) => {
  const { messageId, requestId, args } = payload;
  let request$;
  switch (requestId) {
    case CrossMessageRequestId.TestGet:
      request$ = TestModel.get.apply(null, args);
      break;
    case CrossMessageRequestId.TestCreate:
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
      .then((data) => {
        chrome.tabs.sendMessage(tab.id, {
          type: CommonEventType.CrossMsgResponse,
          payload: {
            data,
            messageId,
          }
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tab.id, {
          type: CommonEventType.CrossMsgResponse,
          payload: {
            error,
            messageId,
          }
        });
      });
  }
};
