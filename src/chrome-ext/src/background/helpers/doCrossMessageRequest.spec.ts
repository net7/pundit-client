import { CrossMsgRequestId } from '../../../../common/types';
import { doCrossMessageRequest } from './doCrossMessageRequest';
import { hasApiAccess, openSiteAccessTab } from './apiAccess';

jest.mock('./apiAccess', () => ({
  hasApiAccess: jest.fn(() => Promise.resolve(false)),
  openSiteAccessTab: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../storage', () => ({ ChromeExtStorage: { get: jest.fn(() => Promise.resolve('https://app.example.org/')) } }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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
