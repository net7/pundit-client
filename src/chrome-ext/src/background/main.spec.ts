import { CommunicationSettings } from 'src/communication';
import { CommonEventType, CrossMsgRequestId } from '../../../common/types';
import { AnnotationModel } from '../../../common/models';
import { ChromeExtStorage } from './storage';
import { listen } from './listener';
import { onContentScriptMessage } from './handlers/onContentScriptMessage';

jest.mock('./listener', () => ({ listen: jest.fn() }));
jest.mock('./handlers', () => ({ onBrowserActionClicked: jest.fn() }));
jest.mock('./storage', () => ({
  ChromeExtStorage: {
    // what a page stored before this change
    get: jest.fn(() => Promise.resolve('https://stale.example.org/api')),
    set: jest.fn(() => Promise.resolve(null)),
  },
}));
jest.mock('../../../common/models', () => ({
  NotebookModel: {},
  AnnotationModel: { get: jest.fn() },
  SocialModel: {},
  ReplyModel: {},
  AuthModel: {},
  TagModel: {},
  SemanticPredicateModel: {},
  AiModel: {},
  OntologyModel: {},
  ClientStatusModel: {},
}));
jest.mock('../../../common/models/analytics-model', () => ({ AnalyticsModel: {} }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const sender = { tab: { id: 4 } } as chrome.runtime.MessageSender;

describe('background worker addresses (design D2)', () => {
  let listenCalls = 0;

  beforeAll(async () => {
    Object.assign(globalThis as any, {
      API_BASE_URL: 'https://app.build.org/api',
      AUTH_BASE_URL: 'https://app.build.org/',
      STATUS_URL: 'https://app.build.org/api/client-status',
      chrome: { tabs: { sendMessage: jest.fn() } },
    });
    Object.assign(CommunicationSettings, { apiBaseUrl: undefined, authBaseUrl: undefined });
    // the worker starts
    await import('./main');
    listenCalls = (listen as jest.Mock).mock.calls.length;
  });

  beforeEach(() => jest.clearAllMocks());

  it('holds the build addresses on start and listens', () => {
    expect(CommunicationSettings.apiBaseUrl).toBe('https://app.build.org/api');
    expect(CommunicationSettings.authBaseUrl).toBe('https://app.build.org/');
    expect(listenCalls).toBe(1);
  });

  it('sends a relayed request right after start to the build API address', async () => {
    let baseUrlAtRequest: unknown;
    (AnnotationModel.get as jest.Mock).mockImplementation(() => {
      baseUrlAtRequest = CommunicationSettings.apiBaseUrl;
      return Promise.resolve({ status: 200, data: {} });
    });

    onContentScriptMessage({
      type: CommonEventType.CrossMsgRequest,
      payload: { messageId: 'm1', requestId: CrossMsgRequestId.AnnotationGet, args: ['01J9ZK7Q3W8X2Y4V6T5R1N0M9P'] },
    }, sender);
    await flush();

    expect(baseUrlAtRequest).toBe('https://app.build.org/api');
    expect(CommunicationSettings.apiBaseUrl).toBe('https://app.build.org/api');
    expect(CommunicationSettings.authBaseUrl).toBe('https://app.build.org/');
    expect(ChromeExtStorage.get).not.toHaveBeenCalled();
  });

  it('ignores the communication settings a page sends', async () => {
    onContentScriptMessage({
      type: CommonEventType.InitCommunicationSettings,
      payload: { apiBaseUrl: 'https://evil.example.org/api', authBaseUrl: 'https://evil.example.org/' },
    }, sender);
    await flush();

    expect(CommunicationSettings.apiBaseUrl).toBe('https://app.build.org/api');
    expect(CommunicationSettings.authBaseUrl).toBe('https://app.build.org/');
    expect(ChromeExtStorage.set).not.toHaveBeenCalled();
  });
});
