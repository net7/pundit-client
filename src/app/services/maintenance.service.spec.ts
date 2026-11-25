import { TestBed } from '@angular/core/testing';
import { translate } from '@net7/core';
import en_US from 'src/app/config/i18n/en_US';
import { environment as env } from 'src/environments/environment';
import { ClientStatusModel } from 'src/common/models';
import { getClientVersion } from '../helpers/client-version.helper';
import { MaintenanceService } from './maintenance.service';

jest.mock('src/common/models', () => ({ ClientStatusModel: { get: jest.fn() } }));
jest.mock('../helpers/client-version.helper', () => ({ getClientVersion: jest.fn() }));

const getMock = ClientStatusModel.get as jest.Mock;
const versionMock = getClientVersion as jest.Mock;

const ON = { version: 1, notices: [{ id: 'maintenance', active: true, level: 'maintenance' }] };
const OUTDATED = {
  version: 1,
  notices: [{
    id: 'maintenance', active: true, level: 'maintenance', appliesTo: { maxClientVersion: '1.18.0' }
  }]
};
const OFF = { version: 1, notices: [] };

translate.init({ defaultLang: 'en_US', translations: { en_US } });

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  const { statusUrl } = env as { statusUrl?: string };

  const setStatusUrl = (url: string | undefined) => {
    (env as { statusUrl?: string }).statusUrl = url;
  };

  beforeEach(() => {
    jest.useFakeTimers({ now: 1_000_000 });
    getMock.mockReset();
    versionMock.mockReset().mockReturnValue('1.18.0');
    setStatusUrl('https://app.example.test/api/client-status');
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintenanceService);
  });

  afterEach(() => {
    service.stop();
    setStatusUrl(statusUrl);
    jest.useRealTimers();
  });

  describe('without a status URL', () => {
    it('makes no request and shows no notice', async () => {
      setStatusUrl(undefined);
      service.start();
      await service.ready();
      expect(getMock).not.toHaveBeenCalled();
      expect(service.notice$.value).toBeNull();
    });
  });

  describe('reading the status', () => {
    it('passes the configured URL to the model', async () => {
      getMock.mockResolvedValue(OFF);
      await service.refresh(true);
      expect(getMock).toHaveBeenCalledWith('https://app.example.test/api/client-status');
    });

    it('emits the maintenance notice', async () => {
      getMock.mockResolvedValue(ON);
      await service.refresh(true);
      expect(service.notice$.value).toEqual({ id: 'maintenance', outdated: false });
    });

    it('emits an outdated notice for a client up to maxClientVersion', async () => {
      versionMock.mockReturnValue('1.18.0.1');
      getMock.mockResolvedValue(OUTDATED);
      await service.refresh(true);
      expect(service.notice$.value).toEqual({ id: 'maintenance', outdated: true });
    });

    it('emits no notice for a client above maxClientVersion', async () => {
      versionMock.mockReturnValue('1.19.0');
      getMock.mockResolvedValue(OUTDATED);
      await service.refresh(true);
      expect(service.notice$.value).toBeNull();
    });

    it('reuses a read younger than 60 s', async () => {
      getMock.mockResolvedValue(OFF);
      await service.refresh(true);
      jest.setSystemTime(1_000_000 + 59_000);
      await service.refresh();
      expect(getMock).toHaveBeenCalledTimes(1);
      jest.setSystemTime(1_000_000 + 61_000);
      await service.refresh();
      expect(getMock).toHaveBeenCalledTimes(2);
    });

    it('reads again when forced', async () => {
      getMock.mockResolvedValue(OFF);
      await service.refresh(true);
      await service.refresh(true);
      expect(getMock).toHaveBeenCalledTimes(2);
    });

    it('shares a read in progress', async () => {
      getMock.mockResolvedValue(OFF);
      await Promise.all([service.refresh(true), service.refresh(true)]);
      expect(getMock).toHaveBeenCalledTimes(1);
    });

    it('emits null when the notice is switched off', async () => {
      const values: unknown[] = [];
      service.notice$.subscribe((value) => values.push(value));
      getMock.mockResolvedValueOnce(ON).mockResolvedValueOnce(OFF);
      await service.refresh(true);
      await service.refresh(true);
      expect(values).toEqual([null, { id: 'maintenance', outdated: false }, null]);
    });

    it('does not emit again when the notice is unchanged', async () => {
      const values: unknown[] = [];
      service.notice$.subscribe((value) => values.push(value));
      getMock.mockResolvedValue(ON);
      await service.refresh(true);
      await service.refresh(true);
      expect(values).toHaveLength(2);
    });
  });

  describe('failed reads', () => {
    it('shows no notice when the first read fails', async () => {
      getMock.mockResolvedValue(null);
      await service.refresh(true);
      expect(service.notice$.value).toBeNull();
    });

    it('shows no notice when the first response is invalid', async () => {
      getMock.mockResolvedValue({ version: 2, notices: [] });
      await service.refresh(true);
      expect(service.notice$.value).toBeNull();
    });

    it('keeps the notice when a later read fails', async () => {
      getMock.mockResolvedValueOnce(ON).mockResolvedValueOnce(null);
      await service.refresh(true);
      await service.refresh(true);
      expect(service.notice$.value).toEqual({ id: 'maintenance', outdated: false });
    });

    it('keeps no notice when a read fails after the notice was switched off', async () => {
      getMock.mockResolvedValueOnce(ON).mockResolvedValueOnce(OFF).mockResolvedValueOnce('<html>');
      await service.refresh(true);
      await service.refresh(true);
      await service.refresh(true);
      expect(service.notice$.value).toBeNull();
    });

    it('never rejects when the model throws', async () => {
      getMock.mockRejectedValue(new Error('boom'));
      await expect(service.refresh(true)).resolves.toBeUndefined();
      expect(service.notice$.value).toBeNull();
    });

    it('gives up after 3.5 s when the answer never comes back', async () => {
      getMock.mockReturnValue(new Promise(() => undefined));
      const read = service.refresh(true);
      jest.advanceTimersByTime(3500);
      await expect(read).resolves.toBeUndefined();
      expect(service.notice$.value).toBeNull();
    });
  });

  describe('start and ready', () => {
    it('resolves ready after the first read, even when it fails', async () => {
      getMock.mockResolvedValue(null);
      service.start();
      await expect(service.ready()).resolves.toBeUndefined();
      expect(getMock).toHaveBeenCalledTimes(1);
    });

    it('reads every 5 minutes while the page is visible', async () => {
      getMock.mockResolvedValue(OFF);
      service.start();
      await service.ready();
      await jest.advanceTimersByTimeAsync(5 * 60_000);
      expect(getMock).toHaveBeenCalledTimes(2);
    });

    it('skips the periodic read while the page is hidden', async () => {
      getMock.mockResolvedValue(OFF);
      const visibility = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
      service.start();
      await service.ready();
      await jest.advanceTimersByTimeAsync(5 * 60_000);
      expect(getMock).toHaveBeenCalledTimes(1);

      visibility.mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      await jest.advanceTimersByTimeAsync(0);
      expect(getMock).toHaveBeenCalledTimes(2);
      visibility.mockRestore();
    });

    it('starts once', async () => {
      getMock.mockResolvedValue(OFF);
      service.start();
      service.start();
      await service.ready();
      expect(getMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('texts', () => {
    it('words the maintenance notice', () => {
      expect(service.texts({ id: 'maintenance', outdated: false })).toEqual({
        label: 'Maintenance',
        title: 'Pundit is under maintenance',
        text: 'Annotations are not available for now. Please try again later.',
      });
    });

    it('asks the extension to update', () => {
      const { chromeExt } = env;
      (env as { chromeExt: boolean }).chromeExt = true;
      expect(service.texts({ id: 'maintenance', outdated: true }).title).toBe('Update Pundit');
      (env as { chromeExt: boolean }).chromeExt = chromeExt;
    });

    it('asks the embed to reload the page', () => {
      expect(service.texts({ id: 'maintenance', outdated: true })).toEqual({
        label: 'Reload required',
        title: 'Pundit has been updated',
        text: 'Reload the page to keep annotating.',
      });
    });
  });
});

describe('MaintenanceService > texts$', () => {
  it('emits the words of the notice, and null without one', async () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(MaintenanceService);
    const values: unknown[] = [];
    service.texts$.subscribe((value) => values.push(value));

    service.notice$.next({ id: 'maintenance', outdated: false });
    service.notice$.next(null);

    expect(values).toEqual([
      null,
      {
        label: 'Maintenance',
        title: 'Pundit is under maintenance',
        text: 'Annotations are not available for now. Please try again later.',
      },
      null,
    ]);
  });
});
