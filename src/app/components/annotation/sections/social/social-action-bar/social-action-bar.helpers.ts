import { _t } from '@net7/core';
import { SocialType } from '@pundit/communication';
import { ReplyFormState, ReplyType } from '../reply/reply';

export type SocialBarState = {
  like?: {
    madeByUser?: boolean;
    total: number;
  };
  dislike?: {
    madeByUser?: boolean;
    total: number;
  };
  report?: {
    madeByUser?: boolean;
    total: number;
  };
  endorse?: {
    madeByUser?: boolean;
    total: number;
  };
  reply?: {
    madeByUser?: boolean;
    total: number;
    toggleForm?: boolean;
    form: ReplyFormState;
  };
  isLogged: boolean;
}

export const resetFormState = (newReply?: string): ReplyFormState => {
  const isValidReply = (reply?: string): boolean => !!reply && reply.length > 3;
  return {
    value: newReply,
    placeholder: _t('social#reply_placeholder'),
    actions: [{
      label: _t('social#reply_cancel'),
      source: 'cancel',
      classes: 'pnd-btn-light'
    }, {
      label: _t('social#reply_save'),
      source: 'save',
      disabled: !isValidReply(newReply),
      classes: 'pnd-btn-cta'
    }],
    isLoading: false
  };
};

export const createInitialState = (
  actions: (SocialType | ReplyType)[]
): SocialBarState => ({
  like: actions.includes('Like') ? { total: 0, } : undefined,
  dislike: actions.includes('Dislike') ? { total: 0 } : undefined,
  report: actions.includes('Report') ? { total: 0 } : undefined,
  endorse: actions.includes('Endorse') ? { total: 0 } : undefined,
  reply: actions.includes('Reply') ? { total: 0, form: resetFormState() } : undefined,
  isLogged: false,
});
