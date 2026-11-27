import { TestBed } from '@angular/core/testing';
import { _t, translate } from '@net7/core';
import en_US from 'src/app/config/i18n/en_US';
import { NotebookModel } from '../../common/models';
import { NotebookService } from './notebook.service';
import { ToastService } from './toast.service';
import { UserService } from './user.service';

jest.mock('../../common/models', () => ({ NotebookModel: { setDefault: jest.fn() } }));

const setDefaultMock = NotebookModel.setDefault as jest.Mock;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('NotebookService.setSelected (design D7)', () => {
  let service: NotebookService;
  let toastService: { error: jest.Mock };

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    translate.setLangTranslations('en', en_US);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    toastService = { error: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastService, useValue: toastService },
        { provide: UserService, useValue: { whoami: () => ({ id: 'u1' }) } },
      ],
    });
    service = TestBed.inject(NotebookService);
    service.setSelected('nb-previous');
  });

  afterEach(() => jest.restoreAllMocks());

  it('keeps the new selection when the BE API accepts it', async () => {
    setDefaultMock.mockResolvedValue({ status: 200, data: null });

    service.setSelected('nb-new', true);
    await flush();

    expect(setDefaultMock).toHaveBeenCalledWith('nb-new');
    expect((service as any).selectedId).toBe('nb-new');
    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('restores the previous selection and shows the error toast when the BE API refuses it', async () => {
    setDefaultMock.mockRejectedValue({ response: { status: 422, data: { message: 'Not writable' } } });
    const changed = jest.fn();
    service.selectedChanged$.subscribe(changed);

    service.setSelected('nb-read-only', true);
    await flush();

    expect((service as any).selectedId).toBe('nb-previous');
    expect(changed).toHaveBeenCalled();
    expect(toastService.error).toHaveBeenCalledWith({
      title: _t('toast#notebookchangecurrent_error_title'),
      text: _t('toast#notebookchangecurrent_error_text'),
    });
  });

  it('leaves a later selection alone when an earlier change fails', async () => {
    let rejectFirst!: (reason: unknown) => void;
    setDefaultMock
      .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectFirst = reject; }))
      .mockResolvedValueOnce({ status: 200, data: null });

    service.setSelected('nb-first', true);
    service.setSelected('nb-second', true);
    rejectFirst({ response: { status: 422 } });
    await flush();

    expect((service as any).selectedId).toBe('nb-second');
  });
});
