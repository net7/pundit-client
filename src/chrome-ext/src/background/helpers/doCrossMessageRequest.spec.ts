import { CrossMsgRequestId } from '../../../../common/types';
import { AnnotationModel, AuthModel, ClientStatusModel } from '../../../../common/models';
import { doCrossMessageRequest } from './doCrossMessageRequest';
import { hasApiAccess, openSiteAccessTab } from './apiAccess';

jest.mock('./apiAccess', () => ({
  hasApiAccess: jest.fn(() => Promise.resolve(false)),
  openSiteAccessTab: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn(() => Promise.resolve('https://app.example.org/')) } }));
jest.mock('../../../../common/models', () => ({
  NotebookModel: {},
  AnnotationModel: { create: jest.fn() },
  SocialModel: {},
  ReplyModel: {},
  AuthModel: { sso: jest.fn() },
  TagModel: {},
  SemanticPredicateModel: {},
  AiModel: {},
  OntologyModel: {},
  ClientStatusModel: { get: jest.fn() },
}));
jest.mock('../../../../common/models/analytics-model', () => ({ AnalyticsModel: { trigger: jest.fn() } }));

// webpack build constant of the worker
(globalThis as any).STATUS_URL = 'https://app.example.org/api/client-status';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** The payload of the only message sent back to the tab. */
const answer = (sendMessage: jest.Mock) => {
  expect(sendMessage).toHaveBeenCalledTimes(1);
  return sendMessage.mock.calls[0][1].payload;
};

/** An axios response as the models resolve it, with what the page must not see. */
const axiosResponse = (status: number, data: unknown) => ({
  status,
  data,
  statusText: 'OK',
  headers: { 'set-cookie': 'pundit_session=secret' },
  config: { headers: { 'X-CSRF-TOKEN': 'token-sent' } },
  request: {},
});

describe('doCrossMessageRequest extension access', () => {
  const sendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).chrome = { tabs: { sendMessage } };
  });

  it('opens the site access tab for the sender tab', async () => {
    doCrossMessageRequest({ id: 7 }, { messageId: 'm1', requestId: CrossMsgRequestId.ExtensionRequestApiAccess, args: [] });
    await flush();

    expect(openSiteAccessTab).toHaveBeenCalledWith(7);
    expect(sendMessage).toHaveBeenCalledWith(7, expect.objectContaining({
      payload: expect.objectContaining({ messageId: 'm1', response: null }),
    }));
  });

  it('answers the access check', async () => {
    doCrossMessageRequest({ id: 7 }, { messageId: 'm2', requestId: CrossMsgRequestId.ExtensionHasApiAccess, args: [] });
    await flush();

    expect(hasApiAccess).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(7, expect.objectContaining({
      payload: expect.objectContaining({ messageId: 'm2', response: false }),
    }));
  });
});

describe('doCrossMessageRequest answers (design D1)', () => {
  const sendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).chrome = { tabs: { sendMessage } };
  });

  it('answers a success with status and data only', async () => {
    (AnnotationModel.create as jest.Mock).mockResolvedValue(axiosResponse(201, { id: 'a1' }));

    doCrossMessageRequest({ id: 7 }, { messageId: 'm1', requestId: CrossMsgRequestId.AnnotationCreate, args: [{}] });
    await flush();

    expect(answer(sendMessage)).toEqual({ messageId: 'm1', response: { status: 201, data: { id: 'a1' } } });
  });

  it('leaves the csrf_token out of an object body', async () => {
    (AuthModel.sso as jest.Mock).mockResolvedValue(axiosResponse(200, { userinfo: { id: 1 }, csrf_token: 'secret' }));

    doCrossMessageRequest({ id: 7 }, { messageId: 'm2', requestId: CrossMsgRequestId.AuthSso, args: [] });
    await flush();

    expect(answer(sendMessage)).toEqual({ messageId: 'm2', response: { status: 200, data: { userinfo: { id: 1 } } } });
  });

  it('answers a failure with the status and data of its response only', async () => {
    const error = Object.assign(new Error('Forbidden'), {
      config: { headers: { 'X-CSRF-TOKEN': 'token-sent' } },
      response: axiosResponse(403, { message: 'Forbidden', csrf_token: 'secret' }),
    });
    (AnnotationModel.create as jest.Mock).mockRejectedValue(error);

    doCrossMessageRequest({ id: 7 }, { messageId: 'm3', requestId: CrossMsgRequestId.AnnotationCreate, args: [{}] });
    await flush();

    expect(answer(sendMessage)).toEqual({
      messageId: 'm3',
      error: { response: { status: 403, data: { message: 'Forbidden' } } },
    });
  });

  it('answers a failure without a response with an error that has no response', async () => {
    const error = Object.assign(new Error('Network Error'), { config: { headers: { 'X-CSRF-TOKEN': 'token-sent' } } });
    (AnnotationModel.create as jest.Mock).mockRejectedValue(error);

    doCrossMessageRequest({ id: 7 }, { messageId: 'm4', requestId: CrossMsgRequestId.AnnotationCreate, args: [{}] });
    await flush();

    const payload = answer(sendMessage);
    expect(payload.messageId).toBe('m4');
    expect(payload.error).toBeTruthy();
    expect(payload.error).not.toHaveProperty('response');
    expect(payload.error).not.toHaveProperty('config');
  });

  it('answers a local operation with its value unchanged', async () => {
    doCrossMessageRequest({ id: 7 }, { messageId: 'm5', requestId: CrossMsgRequestId.ExtensionHasApiAccess, args: [] });
    await flush();

    expect(answer(sendMessage)).toEqual({ messageId: 'm5', response: false });
  });

  it('answers the client status with the status JSON unchanged, even when it has a status key', async () => {
    const statusJson = { status: 'maintenance', message: 'Back soon' };
    (ClientStatusModel.get as jest.Mock).mockResolvedValue(statusJson);

    doCrossMessageRequest({ id: 7 }, { messageId: 'm6', requestId: CrossMsgRequestId.ClientStatusGet, args: [] });
    await flush();

    expect(ClientStatusModel.get).toHaveBeenCalledWith('https://app.example.org/api/client-status');
    expect(answer(sendMessage)).toEqual({ messageId: 'm6', response: statusJson });
  });
});
