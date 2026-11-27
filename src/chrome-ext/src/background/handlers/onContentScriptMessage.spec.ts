import { CommunicationSettings } from 'src/communication';
import { CommonEventType } from '../../../../common/types';
import * as helpers from '../helpers';
import { ChromeExtStorage } from '../storage';
import { onBrowserActionClicked } from '.';
import { onContentScriptMessage } from './onContentScriptMessage';

jest.mock('../helpers', () => ({
  doPageAnnotationsRequest: jest.fn(),
  doCrossMessageRequest: jest.fn(),
  doImageDataRequest: jest.fn(),
  updateBadgeText: jest.fn(),
  updateBadgeTitle: jest.fn(),
}));
jest.mock('.', () => ({ onBrowserActionClicked: jest.fn() }));
jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn() } }));

const requestMock = helpers.doPageAnnotationsRequest as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const EXTENSION_ID = 'pundit-extension-id';
const sender = { id: EXTENSION_ID, tab: { id: 4 } } as chrome.runtime.MessageSender;
const documentInfo = {
  type: CommonEventType.DocumentInfoResponse,
  payload: { pageContext: 'http://x', active: false },
};

describe('onContentScriptMessage: badge request', () => {
  beforeAll(() => {
    (globalThis as any).chrome = { runtime: { id: EXTENSION_ID } };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    Object.assign(CommunicationSettings, { apiBaseUrl: undefined, csrfToken: 'session-token' });
  });

  afterEach(() => jest.restoreAllMocks());

  it('updates the badge and leaves the stored CSRF token untouched', async () => {
    requestMock.mockResolvedValue({ tabId: 4, total: 5 });

    onContentScriptMessage(documentInfo, sender);
    await flush();

    expect(CommunicationSettings.csrfToken).toBe('session-token');
    expect(helpers.updateBadgeText).toHaveBeenCalledWith(4, 5);
  });

  it('logs a failure and leaves the badge empty', async () => {
    requestMock.mockRejectedValue({ response: { status: 419 } });

    onContentScriptMessage(documentInfo, sender);
    await flush();

    expect(console.warn).toHaveBeenCalled();
    expect(helpers.updateBadgeText).not.toHaveBeenCalled();
    expect(CommunicationSettings.csrfToken).toBe('session-token');
  });
});

describe('onContentScriptMessage: sender (design D4)', () => {
  const relay = {
    type: CommonEventType.CrossMsgRequest,
    payload: { messageId: 'm1', requestId: 'annotation.get', args: ['a1'] },
  };
  const image = { type: CommonEventType.ImageDataRequest, payload: { messageId: 'i1', src: 'https://x/a.png' } };
  const activeIn = (active: unknown) => (ChromeExtStorage.get as jest.Mock).mockResolvedValue(active);

  beforeAll(() => {
    (globalThis as any).chrome = { runtime: { id: EXTENSION_ID } };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    activeIn(true);
  });

  it.each([
    ['a foreign sender id', { id: 'another-extension', tab: { id: 4 } }],
    ['no sender id', { tab: { id: 4 } }],
    ['no tab', { id: EXTENSION_ID }],
  ])('ignores a message with %s', async (_label, from) => {
    onContentScriptMessage(relay, from as chrome.runtime.MessageSender);
    onContentScriptMessage(image, from as chrome.runtime.MessageSender);
    onContentScriptMessage({ type: CommonEventType.RootElementExists, payload: null }, from as chrome.runtime.MessageSender);
    onContentScriptMessage({ type: CommonEventType.AnnotationsUpdate, payload: 3 }, from as chrome.runtime.MessageSender);
    await flush();

    expect(helpers.doCrossMessageRequest).not.toHaveBeenCalled();
    expect(helpers.doImageDataRequest).not.toHaveBeenCalled();
    expect(onBrowserActionClicked).not.toHaveBeenCalled();
    expect(helpers.updateBadgeText).not.toHaveBeenCalled();
  });

  it('serves a relay and an image request from an active tab', async () => {
    onContentScriptMessage(relay, sender);
    onContentScriptMessage(image, sender);
    await flush();

    expect(ChromeExtStorage.get).toHaveBeenCalledWith('active.4');
    expect(helpers.doCrossMessageRequest).toHaveBeenCalledWith(sender.tab, relay.payload);
    expect(helpers.doImageDataRequest).toHaveBeenCalledWith(sender.tab, image.payload);
  });

  it.each([undefined, false, null])('neither sends nor answers a relay or image request when the tab state is %s', async (state) => {
    activeIn(state);

    onContentScriptMessage(relay, sender);
    onContentScriptMessage(image, sender);
    await flush();

    expect(helpers.doCrossMessageRequest).not.toHaveBeenCalled();
    expect(helpers.doImageDataRequest).not.toHaveBeenCalled();
  });
});
