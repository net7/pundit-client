import { AnalyticsModel } from '../../../../common/models/analytics-model';
import { CommonEventType, CrossMsgRequestId } from '../../../../common/types';
import {
  AnnotationModel,
  AuthModel,
  NotebookModel,
  TagModel,
  SemanticPredicateModel,
  SocialModel
} from '../../../../common/models';

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
    case CrossMsgRequestId.NotebookSetDefault:
      request$ = NotebookModel.setDefault.apply(null, args);
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
    // SOCIAL REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.SocialCreate:
      request$ = SocialModel.create.apply(null, args);
      break;
    case CrossMsgRequestId.SocialRemove:
      request$ = SocialModel.remove.apply(null, args);
      break;
    case CrossMsgRequestId.SocialUpdate:
      request$ = SocialModel.update.apply(null, args);
      break;
    // AUTH REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.AuthSignup:
      request$ = AuthModel.signup.apply(null, args);
      break;
    case CrossMsgRequestId.AuthLogin:
      request$ = AuthModel.login.apply(null, args);
      break;
    case CrossMsgRequestId.AuthLogout:
      request$ = AuthModel.logout.apply(null, args);
      break;
    case CrossMsgRequestId.AuthVerifyMail:
      request$ = AuthModel.verifyEmail.apply(null, args);
      break;
    case CrossMsgRequestId.AuthSso:
      request$ = AuthModel.sso.apply(null, args);
      break;
    // ANALYTICS REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.AnalyticsTrigger:
      request$ = AnalyticsModel.trigger.apply(null, args);
      break;
    // TAG REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.TagGet:
      request$ = TagModel.get.apply(null, args);
      break;
    // SEMANTIC PREDICATE REQUEST
    // --------------------------------------------------->
    case CrossMsgRequestId.SemanticPredicateGet:
      request$ = SemanticPredicateModel.get.apply(null, args);
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
