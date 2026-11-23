import { TestBed } from '@angular/core/testing';
import { PopupService } from './popup.service';
import { ModalService } from './modal.service';

const ORIGIN = 'https://app.example.org';

const post = (data: unknown, origin = ORIGIN) => {
  window.dispatchEvent(new MessageEvent('message', { data, origin }));
};

describe('PopupService', () => {
  let service: PopupService;
  let received: MessageEvent[];

  beforeEach(() => {
    jest.spyOn(window, 'open').mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [{ provide: ModalService, useValue: { close: jest.fn() } }],
    });
    service = TestBed.inject(PopupService);
    received = [];
    service.open('https://provider/auth', { origin: ORIGIN }).subscribe((m) => received.push(m));
  });

  afterEach(() => jest.restoreAllMocks());

  it('accepts the outcome message from the application origin', () => {
    post({ source: 'pundit-login', status: 'ok' });

    expect(received.map(({ data }) => data)).toEqual([{ source: 'pundit-login', status: 'ok' }]);
  });

  it('ignores a message from another origin', () => {
    post({ source: 'pundit-login', status: 'ok' }, 'https://evil.example.org');

    expect(received).toEqual([]);
  });

  it('ignores a message without source pundit-login', () => {
    post({ status: 'ok' });
    post({ source: 'other', status: 'ok' });

    expect(received).toEqual([]);
  });

  it('ignores a message with null data', () => {
    post(null);

    expect(received).toEqual([]);
  });

  it('reads only the first outcome message', () => {
    post({ source: 'pundit-login', status: 'error', error: 'provider_failed' });
    post({ source: 'pundit-login', status: 'ok' });

    expect(received).toHaveLength(1);
  });

  it('accepts nothing when no origin is configured', () => {
    received = [];
    service.open('https://provider/auth', { origin: '' }).subscribe((m) => received.push(m));

    post({ source: 'pundit-login', status: 'ok' }, '');

    expect(received).toEqual([]);
  });
});
