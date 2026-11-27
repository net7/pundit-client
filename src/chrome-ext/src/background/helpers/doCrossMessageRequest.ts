import { CommunicationSettings } from 'src/communication';
import { AnalyticsModel } from '../../../../common/models/analytics-model';
import { CommonEventType, CrossMsgRequestId } from '../../../../common/types';
import {
  AnnotationModel,
  AuthModel,
  NotebookModel,
  TagModel,
  SemanticPredicateModel,
  SocialModel,
  ReplyModel,
  AiModel,
  OntologyModel,
  ClientStatusModel
} from '../../../../common/models';
import { ChromeExtStorage } from '../storage';
import { hasApiAccess, openSiteAccessTab } from './apiAccess';
import { ChromeExtStorageKey } from '../../types';

// webpack build env variables
declare const STATUS_URL: string;

type Handler = (args: any, tab: chrome.tabs.Tab) => unknown;

/**
 * A local operation of the worker: it does not call the BE API and resolves to a plain value
 * (a boolean, null, the public status JSON), which is answered unchanged.
 */
type LocalHandler = { local: Handler };

const local = (run: Handler): LocalHandler => ({ local: run });

// Maps each CrossMsgRequestId to the model invocation it performed in the
// original switch. Each handler receives the request `args` and the sender tab
// and returns the resulting request, mirroring the previous
// `Model.method.apply(null, args)`. A model handler resolves to an axios
// response; a local one is wrapped in `local()`.
const requestHandlers: {
  [key in CrossMsgRequestId]?: Handler | LocalHandler
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
  [CrossMsgRequestId.AuthResendVerificationMail]:
    (args) => AuthModel.resendVerificationMail.apply(null, args),
  [CrossMsgRequestId.AuthSso]: (args) => AuthModel.sso.apply(null, args),
  // ANALYTICS REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.AnalyticsTrigger]: local((args) => AnalyticsModel.trigger.apply(null, args)),
  // TAG REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.TagGet]: (args) => TagModel.get.apply(null, args),
  // SEMANTIC PREDICATE REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.SemanticPredicateGet]: (args) => SemanticPredicateModel.get.apply(null, args),
  // AI REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.AiAnnotate]: (args) => AiModel.annotate.apply(null, args),
  // ONTOLOGY REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.OntologyList]: (args) => OntologyModel.list.apply(null, args),
  [CrossMsgRequestId.OntologySaveSelection]:
    (args) => OntologyModel.saveSelection.apply(null, args),
  [CrossMsgRequestId.OntologySearchElements]:
    (args) => OntologyModel.searchElements.apply(null, args),
  // EXTENSION ACCESS REQUEST
  // --------------------------------------------------->
  [CrossMsgRequestId.ExtensionHasApiAccess]: local(() => hasApiAccess()),
  [CrossMsgRequestId.ExtensionRequestApiAccess]: local((_args, tab) => openSiteAccessTab(tab?.id)),
  // CLIENT STATUS REQUEST
  // --------------------------------------------------->
  // The URL is the background's own: any page can send this request, so its args are ignored.
  [CrossMsgRequestId.ClientStatusGet]: local(() => ClientStatusModel.get(STATUS_URL)),
};

/** The body without its `csrf_token`: the token stays in the worker. */
const withoutCsrfToken = (data: unknown) => {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !('csrf_token' in data)) {
    return data;
  }
  const rest = { ...(data as Record<string, unknown>) };
  delete rest.csrf_token;
  return rest;
};

/** What the page may see of a BE API response: its status and body, nothing else. */
const toPageResponse = (response: any) => ({
  status: response?.status,
  data: withoutCsrfToken(response?.data),
});

export const doCrossMessageRequest = (tab: any, payload: any) => {
  const { messageId, requestId, args } = payload;
  const entry = requestHandlers[requestId as CrossMsgRequestId];
  const isLocal = !!entry && typeof entry !== 'function';
  const handler = entry && (typeof entry === 'function' ? entry : entry.local);
  const request$ = handler ? handler(args, tab) : undefined;
  if (request$) {
    ChromeExtStorage.get(ChromeExtStorageKey.ApiBaseUrl)
      .then((value) => {
        CommunicationSettings.apiBaseUrl = value as string;
        return ChromeExtStorage.get(ChromeExtStorageKey.AuthBaseUrl);
      })
      .then((value) => {
        CommunicationSettings.authBaseUrl = value as string;
        return request$;
      })
      .then((response) => {
        chrome.tabs.sendMessage(tab.id, {
          type: CommonEventType.CrossMsgResponse,
          payload: {
            response: isLocal ? response : toPageResponse(response),
            messageId,
          }
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tab.id, {
          type: CommonEventType.CrossMsgResponse,
          payload: {
            error: error?.response ? { response: toPageResponse(error.response) } : {},
            messageId,
          }
        });
      });
  }
};
