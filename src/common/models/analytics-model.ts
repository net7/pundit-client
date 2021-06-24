import { analytics } from '@n7-frontend/core';
import mixpanel from 'mixpanel-browser';
import { AnalyticsAction, AnalyticsData, CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';
import { environment as env } from '../../environments/environment';
import { getDocumentHref } from '../../app/models/annotation/html-util';
import packageJson from '../../../package.json';

const { version } = packageJson;

analytics.init([
  // mixpanel config
  {
    track({ type, payload }) {
      if (env.analytics.mixpanel.debug) {
        // eslint-disable-next-line no-console
        console.log('MIXPANEL DEBUG:', type, payload);
      } else {
        mixpanel.track(type, payload);
      }
    },
    actions: [
      AnalyticsAction.Bootstrap,
      AnalyticsAction.HighlightCreated,
      AnalyticsAction.CommentCreated,
      AnalyticsAction.NotebookCreated,
      AnalyticsAction.NotebookCurrentChanged,
      AnalyticsAction.NotebookVisibilityChanged,
      AnalyticsAction.AnnotationAnchoringSuccess,
      AnalyticsAction.AnnotationAnchoringError,
      AnalyticsAction.LoginButtonClick,
      AnalyticsAction.LoginGoogleClick,
      AnalyticsAction.LoginFacebookClick,
      AnalyticsAction.LoginEgiClick,
      AnalyticsAction.LoginEmailClick,
      AnalyticsAction.LoginEmailCompleted,
      AnalyticsAction.RegisterButtonClick,
      AnalyticsAction.RegisterFormFieldsCompleted,
      AnalyticsAction.RegisterCheck1Filled,
      AnalyticsAction.RegisterCheck2Filled,
      AnalyticsAction.RegisterEmailClick,
      AnalyticsAction.RegisterEmailCompleted,
      AnalyticsAction.RegisterGoogleClick,
      AnalyticsAction.RegisterFacebookClick,
      AnalyticsAction.RegisterEgiClick,
      AnalyticsAction.AccessGoogleCompleted,
      AnalyticsAction.AccessFacebookCompleted,
      AnalyticsAction.AccessEgiCompleted,
    ]
  }
]);

export class AnalyticsModel {
  static userId: string = null;

  @CrossMessage(CrossMsgRequestId.AnalyticsTrigger)
  static trigger({ action, payload }: AnalyticsData) {
    return new Promise((resolve, reject) => {
      try {
        analytics.trigger(action, payload);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  static track({ action, payload }: AnalyticsData) {
    AnalyticsModel.trigger({
      action,
      payload: {
        ...AnalyticsModel.getCommonParams(),
        ...(payload || {}),
      }
    }).then(() => {
      // do nothing
    }).catch((err) => {
      console.warn('AnalyticsModel track error:', err);
    });
  }

  static getCommonParams() {
    return {
      canonicalUrl: AnalyticsModel.getCanonicalUrl(),
      documentUrl: AnalyticsModel.getDocumentUrl(),
      'annotator-type': env.chromeExt ? 'extension' : 'embed',
      'annotator-version': version,
      'user-id': AnalyticsModel.userId || null
    };
  }

  static getCanonicalUrl() {
    const link = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    return link ? link.href : null;
  }

  static getDocumentUrl() {
    return getDocumentHref();
  }
}
