import { analytics } from '@n7-frontend/core';
import mixpanel from 'mixpanel-browser';
import { AnalyticsAction, AnalyticsData, CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';
import { environment as env } from '../../environments/environment';
import { getDocumentHref } from '../../app/models/annotation/html-util';
import packageJson from '../../../package.json';

const { version } = packageJson;

// mixpanel config
mixpanel.init(env.analytics.mixpanel.token);

analytics.init([
  // mixpanel config
  {
    track({ type, payload }) {
      mixpanel.track(type, payload);
    },
    actions: [
      AnalyticsAction.HighlightCreated,
      AnalyticsAction.CommentCreated,
      AnalyticsAction.NotebookCreated,
      AnalyticsAction.NotebookCurrentChanged,
      AnalyticsAction.NotebookVisibilityChanged,
      AnalyticsAction.LoginButtonClicked,
      AnalyticsAction.LoginSubmitted,
      AnalyticsAction.RegisterButtonClicked,
      AnalyticsAction.RegisterFormFieldsCompleted,
      AnalyticsAction.RegisterCheck1Filled,
      AnalyticsAction.RegisterCheck2Filled,
      AnalyticsAction.RegisterWithGoogleClicked,
      AnalyticsAction.RegisterWithFacebookClicked,
      AnalyticsAction.RegisterWithEgiClicked,
      AnalyticsAction.RegistrationCompleted,
    ]
  }
]);

export class AnalyticsModel {
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
      'annotator-version': version
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
