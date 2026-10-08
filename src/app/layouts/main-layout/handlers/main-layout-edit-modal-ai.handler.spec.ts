import { translate } from '@net7/core';
import { of, Subject, throwError } from 'rxjs';
import { AppEvent } from 'src/app/event-types';
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

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'toast#genericerror_title',
      'toast#genericerror_text',
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
        info: jest.fn(),
        error: jest.fn(),
      },
      annotationService: {
        getAnnotationFromPayload: jest.fn((id: string) => ({ id })),
        add: jest.fn(),
        removeCached: jest.fn(),
      },
      anchorService: { add: jest.fn(), removeByPrefix: jest.fn() },
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

  it('shows the error toast and routes the error to handleError when the request fails', async () => {
    prepareMock.mockReturnValue({ request, chunkMap });
    const error = { response: { status: 400, data: { error: 'no active key' } } };
    layoutDS.aiService.annotate.mockReturnValue(throwError(() => error));

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'comment' });

    expect(workingToast.close).toHaveBeenCalled();
    expect(layoutEH.handleError).toHaveBeenCalledWith(error);
    expect(layoutDS.toastService.error).toHaveBeenCalled();
    expect(layoutDS.toastService.info).not.toHaveBeenCalled();
    expect(processMock).not.toHaveBeenCalled();
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

  it('falls back to highlight for an unknown annotation type', async () => {
    prepareMock.mockReturnValue(null);

    await handler.onAiGenerate({ prompt: 'find names', annotationType: 'bogus' });

    expect(prepareMock).toHaveBeenCalledWith(expect.anything(), 'find names', 'highlight');
  });
});
