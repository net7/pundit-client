import { CrossMsgRequestId } from '../../../../common/types';
import {
  AnnotationModel, AuthModel, ClientStatusModel, NotebookModel, ReplyModel
} from '../../../../common/models';
import { doCrossMessageRequest } from './doCrossMessageRequest';
import { hasApiAccess, openSiteAccessTab } from './apiAccess';

jest.mock('./apiAccess', () => ({
  hasApiAccess: jest.fn(() => Promise.resolve(false)),
  openSiteAccessTab: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn(() => Promise.resolve('https://app.example.org/')) } }));
jest.mock('../../../../common/models', () => ({
  NotebookModel: {
    remove: jest.fn(),
    update: jest.fn(),
    setDefault: jest.fn(),
    userInviteWithEmail: jest.fn(),
    userRemoveWithEmail: jest.fn(),
    resendEmail: jest.fn(),
  },
  AnnotationModel: { create: jest.fn(), get: jest.fn(), remove: jest.fn(), update: jest.fn() },
  SocialModel: {},
  ReplyModel: { remove: jest.fn(), update: jest.fn() },
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

/**
 * The relay operations whose model method puts its first argument into a URL path
 * (template paths of src/communication), with the model method that runs them.
 * Not relayed, so not listed: notebook get (`NotebookGetData` has no handler), reply get,
 * social get; social create and remove send their data in the body.
 */
const pathOperations: [CrossMsgRequestId, () => jest.Mock][] = [
  [CrossMsgRequestId.NotebookRemove, () => NotebookModel.remove as jest.Mock],
  [CrossMsgRequestId.NotebookUpdate, () => NotebookModel.update as jest.Mock],
  [CrossMsgRequestId.NotebookSetDefault, () => NotebookModel.setDefault as jest.Mock],
  [CrossMsgRequestId.NotebookUserInviteWithEmail, () => NotebookModel.userInviteWithEmail as jest.Mock],
  [CrossMsgRequestId.NotebookUserRemoveWithEmail, () => NotebookModel.userRemoveWithEmail as jest.Mock],
  [CrossMsgRequestId.NotebookResendEmail, () => NotebookModel.resendEmail as jest.Mock],
  [CrossMsgRequestId.AnnotationGet, () => AnnotationModel.get as jest.Mock],
  [CrossMsgRequestId.AnnotationRemove, () => AnnotationModel.remove as jest.Mock],
  [CrossMsgRequestId.AnnotationUpdate, () => AnnotationModel.update as jest.Mock],
  [CrossMsgRequestId.ReplyRemove, () => ReplyModel.remove as jest.Mock],
  [CrossMsgRequestId.ReplyUpdate, () => ReplyModel.update as jest.Mock],
];

describe('doCrossMessageRequest identifiers (design D3)', () => {
  const sendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).chrome = { tabs: { sendMessage } };
    pathOperations.forEach(([, method]) => method().mockResolvedValue({ status: 200, data: {} }));
  });

  const accepted: [string, string | number][] = [
    ['a ULID', '01J9ZK7Q3W8X2Y4V6T5R1N0M9P'],
    ['an identifier kept from the annotation server', '9f86d081884c7d659a2feaa0c55ad015'],
    ['a numeric id', '42'],
    ['a numeric id as a number', 42],
  ];

  describe.each(pathOperations)('%s', (requestId, method) => {
    it.each(accepted)('sends %s', async (_label, id) => {
      doCrossMessageRequest({ id: 7 }, { messageId: 'm', requestId, args: [id, { data: {} }] });
      await flush();

      expect(method()).toHaveBeenCalledWith(id, { data: {} });
      expect(answer(sendMessage)).toEqual({ messageId: 'm', response: { status: 200, data: {} } });
    });

    it.each([
      ['a path traversal', '../../user'],
      ['a query', 'abc?x=1'],
      ['an empty string', ''],
      ['a 65-character value', 'a'.repeat(65)],
      ['a missing identifier', undefined],
      ['an object', { id: 'abc' }],
    ])('answers 400 to %s and sends nothing', async (_label, id) => {
      doCrossMessageRequest({ id: 7 }, { messageId: 'm', requestId, args: [id, { data: {} }] });
      await flush();

      expect(method()).not.toHaveBeenCalled();
      expect(answer(sendMessage)).toEqual({
        messageId: 'm',
        error: { response: { status: 400, data: { message: 'Invalid identifier' } } },
      });
    });
  });

  it('answers 400 when the arguments are not a list', async () => {
    doCrossMessageRequest({ id: 7 }, { messageId: 'm', requestId: CrossMsgRequestId.AnnotationGet, args: '../../user' });
    await flush();

    expect(AnnotationModel.get).not.toHaveBeenCalled();
    expect(answer(sendMessage).error.response.status).toBe(400);
  });

  it('accepts a 64-character identifier', async () => {
    doCrossMessageRequest({ id: 7 }, { messageId: 'm', requestId: CrossMsgRequestId.AnnotationGet, args: ['a'.repeat(64)] });
    await flush();

    expect(AnnotationModel.get).toHaveBeenCalledWith('a'.repeat(64));
  });
});
