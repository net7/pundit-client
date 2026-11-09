import { translate } from '@net7/core';
import { of, Subject, throwError } from 'rxjs';
import { AppEvent } from 'src/app/event-types';
import { aiPreviewState$ } from 'src/app/components/edit-modal/edit-modal';
import en_US from 'src/app/config/i18n/en_US';
import { _c } from 'src/app/models/config';
import { MainLayoutEditModalAiHandler } from './main-layout-edit-modal-ai.handler';
import { prepareAiRequest } from './annotation-range-selector.util';
import { processLLMResponse } from './annotation-llm-processor';

jest.mock('./annotation-range-selector.util', () => ({ prepareAiRequest: jest.fn() }));
jest.mock('./annotation-llm-processor', () => ({ processLLMResponse: jest.fn() }));

const prepareMock = prepareAiRequest as jest.Mock;
const processMock = processLLMResponse as jest.Mock;

describe('MainLayoutEditModalAiHandler > onAiGenerate', () => {
  let appEvents: { type: string; payload?: any }[];
  let workingToast: { close: jest.Mock };
  let layoutDS: any;
  let layoutEH: any;
  let handler: MainLayoutEditModalAiHandler;

  const request = {
    chunks: [{ id: 'c0', text: 'some text' }],
    prompt: 'find names',
    annotation_type: 'comment',
    selected_text: 'some text',
  };
  const chunkMap = new Map();
  const showToast = (params: any) => params?.onLoad?.({ close: jest.fn(), update: jest.fn() });

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'toast#ai_error_title',
      'toast#ai_error_generic',
      'toast#ai_error_payload_too_large',
      'toast#ai_error_no_active_api_key',
      'toast#ai_error_invalid_api_key',
      'toast#ai_error_provider_quota_exceeded',
      'toast#ai_error_provider_rate_limited',
      'toast#ai_error_provider_timeout',
      'toast#ai_error_provider_unavailable',
      'toast#ai_error_provider_host_not_found',
      'toast#ai_error_provider_url_blocked',
      'toast#ai_error_structured_output_unsupported',
      'toast#ai_error_model_unavailable',
      'toast#ai_error_invalid_structured_output',
      'toast#ai_error_open_settings',
      'toast#ai_no_results_title',
      'toast#ai_no_results_text',
    ].forEach((key) => translate.setLangTranslation('en', key, key));
  });

  beforeEach(() => {
    prepareMock.mockReset();
    processMock.mockReset();
    appEvents = [];
    workingToast = { close: jest.fn() };

    const appEvent$ = new Subject<{ type: string; payload?: any }>();
    appEvent$.subscribe((e) => appEvents.push(e));
    layoutEH = { appEvent$, handleError: jest.fn() };

    layoutDS = {
      state: { annotation: { pendingPayload: { subject: {} } } },
      pendingAnnotationId: 'pending-id',
      toastService: {
        working: jest.fn(() => workingToast),
        // as the real service: onLoad runs when the toast shows
        info: jest.fn(showToast),
        error: jest.fn(showToast),
      },
      annotationService: {
        getAnnotationFromPayload: jest.fn((id: string) => ({ id })),
        add: jest.fn(),
        removeCached: jest.fn(),
      },
      anchorService: { add: jest.fn(), remove: jest.fn(), removeByPrefix: jest.fn() },
      notebookService: { getSelected: () => ({ id: 'nb' }) },
      aiService: { annotate: jest.fn() },
      removePendingAnnotation: jest.fn(),
    };

    handler = new MainLayoutEditModalAiHandler(layoutDS, layoutEH);
  });

  it('requests the AI annotations through AiService and renders the previews', async () => {
    prepareMock.mockReturnValue({ request, chunkMap });
    const toolCalls = [{ chunkId: 'c0' }];
    layoutDS.aiService.annotate.mockReturnValue(of({ toolCalls, contiguousCalls: [] }));
    processMock.mockResolvedValue([{ type: 'Commenting' }, { type: 'Commenting' }]);

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(prepareMock).toHaveBeenCalledWith(expect.anything(), 'find names', 'comment');
    expect(layoutDS.aiService.annotate).toHaveBeenCalledWith(request);
    expect(processMock).toHaveBeenCalledWith(toolCalls, [], chunkMap, expect.anything(), 'comment');
    expect(layoutDS.annotationService.add).toHaveBeenCalledTimes(2);
    expect(workingToast.close).toHaveBeenCalled();
    expect(appEvents.some((e) => e.type === AppEvent.AiPreviewReady)).toBe(true);
  });

  it('shows the generic AI error toast and routes the error to handleError without a known code', async () => {
    prepareMock.mockReturnValue({ request, chunkMap });
    const error = { response: { status: 400, data: { error: 'no active key' } } };
    layoutDS.aiService.annotate.mockReturnValue(throwError(() => error));

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(workingToast.close).toHaveBeenCalled();
    expect(layoutEH.handleError).toHaveBeenCalledWith(error);
    expect(layoutDS.toastService.error).toHaveBeenCalledWith(expect.objectContaining({
      title: 'toast#ai_error_title',
      text: 'toast#ai_error_generic',
    }));
    expect(layoutDS.toastService.info).not.toHaveBeenCalled();
    expect(processMock).not.toHaveBeenCalled();
  });

  it.each([
    [413, 'payload_too_large'],
    [429, 'provider_rate_limited'],
    [504, 'provider_timeout'],
  ])('shows the "%s"-status message for a response without a JSON body (proxy)', async (status, code) => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prepareMock.mockReturnValue({ request, chunkMap });
    const error = { response: { status, data: `<html>${status}</html>` } };
    layoutDS.aiService.annotate.mockReturnValue(throwError(() => error));

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(layoutEH.handleError).not.toHaveBeenCalled();
    expect(layoutDS.toastService.error).toHaveBeenCalledWith(expect.objectContaining({
      text: `toast#ai_error_${code}`,
    }));
    consoleError.mockRestore();
  });

  it.each([
    ['payload_too_large', 413],
    ['no_active_api_key', 400],
    ['invalid_api_key', 422],
    ['provider_quota_exceeded', 402],
    ['provider_rate_limited', 429],
    ['provider_timeout', 504],
    ['provider_unavailable', 422],
    ['provider_host_not_found', 422],
    ['provider_url_blocked', 422],
    ['structured_output_unsupported', 422],
    ['model_unavailable', 422],
    ['invalid_structured_output', 502],
  ])('shows the "%s" message for a known backend error code', async (code, status) => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prepareMock.mockReturnValue({ request, chunkMap });
    const error = { response: { status, data: { error: 'backend text', code, message: 'detail' } } };
    layoutDS.aiService.annotate.mockReturnValue(throwError(() => error));

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(workingToast.close).toHaveBeenCalled();
    expect(layoutEH.handleError).not.toHaveBeenCalled();
    expect(layoutDS.toastService.error).toHaveBeenCalledWith(expect.objectContaining({
      title: 'toast#ai_error_title',
      text: `toast#ai_error_${code}`,
    }));
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), code, 'detail');
    expect(en_US).toHaveProperty([`toast#ai_error_${code}`]);
    consoleError.mockRestore();
  });

  it('draws the pending highlight before building the request', async () => {
    const order: string[] = [];
    layoutDS.anchorService.add.mockImplementation(async () => { order.push('highlight'); });
    prepareMock.mockImplementation(async () => { order.push('request'); return null; });

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(order).toEqual(['highlight', 'request']);
  });

  it.each([
    ['an error', () => throwError(() => ({ response: { status: 413, data: { error: 'x', code: 'payload_too_large' } } })), 'error'],
    ['no results', () => of({ toolCalls: [], contiguousCalls: [] }), 'info'],
  ])('keeps the working toast until the %s toast shows', async (_case, answer, kind) => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prepareMock.mockReturnValue({ request, chunkMap });
    layoutDS.aiService.annotate.mockReturnValue(answer());
    processMock.mockResolvedValue([]);
    const toast = layoutDS.toastService[kind as 'error' | 'info'];
    toast.mockImplementation(() => undefined);

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(workingToast.close).not.toHaveBeenCalled();
    toast.mock.calls[0][0].onLoad();
    expect(workingToast.close).toHaveBeenCalledTimes(1);
    (console.error as jest.Mock).mockRestore();
  });

  it('keeps the AI error toast 5 s', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prepareMock.mockReturnValue({ request, chunkMap });
    layoutDS.aiService.annotate.mockReturnValue(
      throwError(() => ({ response: { status: 413, data: { error: 'x', code: 'payload_too_large' } } }))
    );
    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });
    expect(layoutDS.toastService.error.mock.calls[0][0].autoCloseDelay).toBe(5000);
    (console.error as jest.Mock).mockRestore();
  });

  describe('errors fixed in the AI settings', () => {
    let consoleError: jest.SpyInstance;
    let windowOpen: jest.SpyInstance;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
      prepareMock.mockReturnValue({ request, chunkMap });
    });

    afterEach(() => {
      consoleError.mockRestore();
      windowOpen.mockRestore();
    });

    const failWith = async (code: string, status: number) => {
      const error = { response: { status, data: { error: 'backend text', code } } };
      layoutDS.aiService.annotate.mockReturnValue(throwError(() => error));
      await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });
      return layoutDS.toastService.error.mock.calls[0][0];
    };

    it.each([
      ['no_active_api_key', 400],
      ['invalid_api_key', 422],
      ['provider_quota_exceeded', 402],
      ['provider_unavailable', 422],
      ['provider_host_not_found', 422],
      ['provider_url_blocked', 422],
      ['structured_output_unsupported', 422],
      ['model_unavailable', 422],
      ['invalid_structured_output', 502],
    ])('keeps the "%s" toast open with a button to the AI settings', async (code, status) => {
      const params = await failWith(code, status);

      expect(params.autoClose).toBe(false);
      expect(params.actions).toEqual([
        { text: 'toast#ai_error_open_settings', payload: expect.any(String) },
      ]);
      expect(en_US).toHaveProperty(['toast#ai_error_open_settings']);
    });

    it('opens the AI settings page of the web app in a new tab and closes the toast', async () => {
      const params = await failWith('no_active_api_key', 400);
      const toast = { close: jest.fn(), update: jest.fn() };

      params.onAction(params.actions[0].payload, toast);

      expect(windowOpen).toHaveBeenCalledWith(`${_c('userLink')}settings/ai`, '_blank', 'noopener');
      expect(toast.close).toHaveBeenCalled();
    });

    it.each([
      ['payload_too_large', 413],
      ['provider_rate_limited', 429],
      ['provider_timeout', 504],
      ['unknown_code', 500],
    ])('adds no button for "%s"', async (code, status) => {
      const params = await failWith(code, status);

      expect(params.actions).toBeUndefined();
      expect(params.autoClose).toBeUndefined();
    });
  });

  it('shows the "no results" toast when the response yields no annotations', async () => {
    prepareMock.mockReturnValue({ request, chunkMap });
    layoutDS.aiService.annotate.mockReturnValue(of({ toolCalls: [], contiguousCalls: [] }));
    processMock.mockResolvedValue([]);

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(layoutDS.toastService.info).toHaveBeenCalled();
    expect(layoutDS.toastService.error).not.toHaveBeenCalled();
    expect(layoutDS.annotationService.add).not.toHaveBeenCalled();
  });

  it('does not call the backend when there is no text to send', async () => {
    prepareMock.mockReturnValue(null);

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(layoutDS.aiService.annotate).not.toHaveBeenCalled();
    expect(layoutDS.toastService.info).toHaveBeenCalled();
  });

  describe('discarding a preview', () => {
    const preview = (quote: string) => ({
      subject: {
        selected: {
          rangeSelector: { startContainer: '/p[1]', endContainer: '/p[1]', startOffset: 0, endOffset: 1 },
          textQuoteSelector: { exact: quote },
        },
      },
    });
    let states: boolean[];
    let subscription: { unsubscribe: () => void };

    beforeEach(async () => {
      states = [];
      subscription = aiPreviewState$.subscribe((active) => states.push(active));
      prepareMock.mockReturnValue({ request, chunkMap });
      layoutDS.aiService.annotate.mockReturnValue(of({ toolCalls: [], contiguousCalls: [] }));
      processMock.mockResolvedValue([preview('one'), preview('two'), preview('three')]);
      layoutDS.saveAnnotation = jest.fn((p: any) => of({ id: `saved-${p.subject.selected.textQuoteSelector.exact}` }));
      layoutDS.tagService = { addMany: jest.fn() };
      layoutDS.state.annotation.updatePayload = null;
      layoutEH.emitOuter = jest.fn();
      await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });
      appEvents = [];
      states = [];
    });

    afterEach(() => subscription.unsubscribe());

    it('removes only that preview: highlight, card and payload', () => {
      handler.discardAiPreview('ai-preview-1');

      expect(layoutDS.anchorService.remove).toHaveBeenCalledWith('ai-preview-1');
      expect(layoutDS.annotationService.removeCached).toHaveBeenCalledWith('ai-preview-1');
      expect(appEvents.map(({ type }) => type)).toEqual([AppEvent.AiPreviewClear]);
      expect(states).toEqual([]);
    });

    it('saves only the previews left', async () => {
      handler.discardAiPreview('ai-preview-1');
      handler.onAiAccept();
      await new Promise(jest.requireActual('timers').setImmediate);

      expect(layoutDS.saveAnnotation.mock.calls.map(([p]: any) => p.subject.selected.textQuoteSelector.exact))
        .toEqual(['one', 'three']);
    });

    it('disables "Save all" when the last preview is discarded', () => {
      handler.discardAiPreview('ai-preview-0');
      handler.discardAiPreview('ai-preview-1');
      expect(states).toEqual([]);
      handler.discardAiPreview('ai-preview-2');
      expect(states).toEqual([false]);

      handler.onAiAccept();
      expect(layoutDS.saveAnnotation).not.toHaveBeenCalled();
    });

    it('ignores an unknown or already discarded preview', () => {
      handler.discardAiPreview('ai-preview-1');
      layoutDS.anchorService.remove.mockClear();
      handler.discardAiPreview('ai-preview-1');
      handler.discardAiPreview('64f1a2b3c4d5e6f7a8b9c0d1');
      expect(layoutDS.anchorService.remove).not.toHaveBeenCalled();
    });

    it('removes the previews left when the modal is cancelled', () => {
      handler.discardAiPreview('ai-preview-1');
      layoutDS.annotationService.removeCached.mockClear();
      handler.removeAiPreviews();
      expect(layoutDS.annotationService.removeCached.mock.calls.map(([id]: any) => id))
        .toEqual(['ai-preview-0', 'ai-preview-2']);
      expect(layoutDS.anchorService.removeByPrefix).toHaveBeenCalledWith('ai-preview-');
    });
  });

  describe('preview state signal (re-enables Generate when no previews are shown)', () => {
    let states: boolean[];
    let subscription: { unsubscribe: () => void };

    beforeEach(() => {
      states = [];
      subscription = aiPreviewState$.subscribe((active) => states.push(active));
      prepareMock.mockReturnValue({ request, chunkMap });
    });

    afterEach(() => subscription.unsubscribe());

    it('emits false when the request fails', async () => {
      layoutDS.aiService.annotate.mockReturnValue(throwError(() => ({ response: { status: 500 } })));

      await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

      expect(states).toEqual([false]);
    });

    it('emits false when no previews can be built', async () => {
      layoutDS.aiService.annotate.mockReturnValue(of({ toolCalls: [], contiguousCalls: [] }));
      processMock.mockResolvedValue([]);

      await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

      expect(states).toEqual([false]);
    });

    it('emits true when previews are rendered', async () => {
      layoutDS.aiService.annotate.mockReturnValue(of({ toolCalls: [{ chunkId: 'c0' }], contiguousCalls: [] }));
      processMock.mockResolvedValue([{ type: 'Commenting' }]);

      await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

      expect(states).toEqual([true]);
    });
  });

  it('falls back to highlight for an unknown annotation type', async () => {
    prepareMock.mockReturnValue(null);

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'bogus' });

    expect(prepareMock).toHaveBeenCalledWith(expect.anything(), 'find names', 'highlight');
  });
});
