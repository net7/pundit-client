import { setExtensionUnavailable, updateExtensionIcon } from './updateExtensionIcon';

describe('extension icon', () => {
  let action: Record<string, jest.Mock>;

  beforeEach(() => {
    action = {
      enable: jest.fn(), disable: jest.fn(), setIcon: jest.fn(),
      setBadgeBackgroundColor: jest.fn(), setBadgeText: jest.fn(), setTitle: jest.fn(),
    };
    (globalThis as any).chrome = { action };
  });

  it('enables the action when showing the active state', () => {
    updateExtensionIcon(7, true);

    expect(action.enable).toHaveBeenCalledWith(7);
    expect(action.disable).not.toHaveBeenCalled();
    expect(action.setIcon).toHaveBeenCalledWith({ tabId: 7, path: 'assets/icons/pundit-icon-38-close.png' });
  });

  it('disables the action on a page where Pundit cannot run', () => {
    setExtensionUnavailable(7);

    expect(action.disable).toHaveBeenCalledWith(7);
    expect(action.setIcon).toHaveBeenCalledWith({ tabId: 7, path: 'assets/icons/pundit-icon-38.png' });
    expect(action.setBadgeText).toHaveBeenCalledWith({ tabId: 7, text: '' });
    expect(action.setTitle).toHaveBeenCalledWith({ tabId: 7, title: 'Pundit is not available on this page' });
  });
});
