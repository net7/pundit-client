import { CommunicationSettings } from '@pundit/communication';
import { AnalyticsModel } from '../../../../common/models/analytics-model';
import { CommonEventType, CrossMsgRequestId } from '../../../../common/types';
import {
  AnnotationModel,
  AuthModel,
  NotebookModel,
  TagModel,
  SemanticPredicateModel,
  SocialModel,
  ReplyModel
} from '../../../../common/models';
import { ChromeExtStorage } from '../storage';
import { ChromeExtStorageKey } from '../../types';

// Maps each CrossMsgRequestId to the model invocation it performed in the
// original switch. Each handler receives the request `args` and returns the
// resulting request, mirroring the previous `Model.method.apply(null, args)`.
const requestHandlers: {
  [key in CrossMsgRequestId]?: (args: any) => unknown
} = {
  // NOTEBOOK REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.NotebookCreate]: (args) => NotebookModel.create.apply(null, args),
  [CrossMsgRequestId.NotebookRemove]: (args) => NotebookModel.remove.apply(null, args),
  [CrossMsgRequestId.NotebookSearch]: (args) => NotebookModel.search.apply(null, args),
  [CrossMsgRequestId.NotebookUpdate]: (args) => NotebookModel.update.apply(null, args),
  [CrossMsgRequestId.NotebookSetDefault]: (args) => NotebookModel.setDefault.apply(null, args),
  [CrossMsgRequestId.NotebookUserSearch]: (args) => NotebookModel.userSearch.apply(null, args),
  [CrossMsgRequestId.NotebookUserInviteWithEmail]:
    (args) => NotebookModel.userInviteWithEmail.apply(null, args),
  [CrossMsgRequestId.NotebookUserRemoveWithEmail]:
    (args) => NotebookModel.userRemoveWithEmail.apply(null, args),
  [CrossMsgRequestId.NotebookResendEmail]: (args) => NotebookModel.resendEmail.apply(null, args),
  // [CrossMsgRequestId.NotebookUserInviteWithId]:
  //   (args) => NotebookModel.userInviteWithId.apply(null, args),
  // [CrossMsgRequestId.NotebookUserRemove]: (args) => NotebookModel.userRemove.apply(null, args),
  // ANNOTATION REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.AnnotationCreate]: (args) => AnnotationModel.create.apply(null, args),
  [CrossMsgRequestId.AnnotationGet]: (args) => AnnotationModel.get.apply(null, args),
  [CrossMsgRequestId.AnnotationRemove]: (args) => AnnotationModel.remove.apply(null, args),
  [CrossMsgRequestId.AnnotationSearch]: (args) => AnnotationModel.search.apply(null, args),
  [CrossMsgRequestId.AnnotationUpdate]: (args) => AnnotationModel.update.apply(null, args),
  // SOCIAL REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.SocialCreate]: (args) => SocialModel.create.apply(null, args),
  [CrossMsgRequestId.SocialRemove]: (args) => SocialModel.remove.apply(null, args),
  // REPLY REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.ReplyCreate]: (args) => ReplyModel.create.apply(null, args),
  [CrossMsgRequestId.ReplyRemove]: (args) => ReplyModel.remove.apply(null, args),
  [CrossMsgRequestId.ReplyUpdate]: (args) => ReplyModel.update.apply(null, args),
  // AUTH REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.AuthSignup]: (args) => AuthModel.signup.apply(null, args),
  [CrossMsgRequestId.AuthLogin]: (args) => AuthModel.login.apply(null, args),
  [CrossMsgRequestId.AuthLogout]: (args) => AuthModel.logout.apply(null, args),
  [CrossMsgRequestId.AuthVerifyMail]: (args) => AuthModel.verifyEmail.apply(null, args),
  [CrossMsgRequestId.AuthSso]: (args) => AuthModel.sso.apply(null, args),
  // ANALYTICS REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.AnalyticsTrigger]: (args) => AnalyticsModel.trigger.apply(null, args),
  // TAG REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.TagGet]: (args) => TagModel.get.apply(null, args),
  // SEMANTIC PREDICATE REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.SemanticPredicateGet]: (args) => SemanticPredicateModel.get.apply(null, args),
};

export const doCrossMessageRequest = (tab: any, payload: any) => {
  const { messageId, requestId, args } = payload;
  const handler = requestHandlers[requestId as CrossMsgRequestId];
  const request$ = handler ? handler(args) : undefined;
  if (request$) {
    ChromeExtStorage.get(ChromeExtStorageKey.ApiBaseUrl)
      .then((value: string) => {
        CommunicationSettings.apiBaseUrl = value;
        return ChromeExtStorage.get(ChromeExtStorageKey.AuthBaseUrl);
      })
      .then((value: string) => {
        CommunicationSettings.authBaseUrl = value;
        return request$;
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
