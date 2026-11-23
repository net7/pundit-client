import * as helpers from '../helpers';
import { onTabUpdated } from './onTabUpdated';

jest.mock('../helpers', () => ({ checkActiveState: jest.fn() }));

describe('onTabUpdated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).chrome = {
      runtime: {},
      tabs: { get: (_id: number, cb: () => void) => cb() },
    };
  });

  it.each([
    [{ title: 'New title' }],
    [{ favIconUrl: 'https://example.com/favicon.ico' }],
    [{ status: 'loading' }],
    [{ audible: true }],
  ])('ignores %j', (changeInfo) => {
    onTabUpdated(7, changeInfo as chrome.tabs.TabChangeInfo);

    expect(helpers.checkActiveState).not.toHaveBeenCalled();
  });

  it('checks the tab when its URL changes', () => {
    onTabUpdated(7, { status: 'loading', url: 'https://example.com/' });

    expect(helpers.checkActiveState).toHaveBeenCalledWith(7);
  });

  it('checks the tab when its page finishes loading', () => {
    onTabUpdated(7, { status: 'complete' });

    expect(helpers.checkActiveState).toHaveBeenCalledWith(7);
  });
});
