import { CommunicationSettings } from 'src/communication';
import { CommonEventType } from '../../../../common/types';
import * as helpers from '../helpers';
import { onContentScriptMessage } from './onContentScriptMessage';

jest.mock('../helpers', () => ({
  doPageAnnotationsRequest: jest.fn(),
  updateBadgeText: jest.fn(),
}));
jest.mock('.', () => ({ onBrowserActionClicked: jest.fn() }));

const requestMock = helpers.doPageAnnotationsRequest as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const sender = { tab: { id: 4 } } as chrome.runtime.MessageSender;
const documentInfo = {
  type: CommonEventType.DocumentInfoResponse,
  payload: { pageContext: 'http://x', active: false },
};

describe('onContentScriptMessage: badge request', () => {
  beforeAll(() => {
    (globalThis as any).API_BASE_URL = 'https://app.example.org/api';
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
    expect(CommunicationSettings.apiBaseUrl).toBe('https://app.example.org/api');
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
