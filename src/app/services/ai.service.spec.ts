import { firstValueFrom } from 'rxjs';
import { AiModel } from 'src/common/models';
import { AiAnnotateRequest } from 'src/communication';
import { AiService } from './ai.service';

jest.mock('src/common/models', () => ({ AiModel: { annotate: jest.fn() } }));

const annotateMock = AiModel.annotate as jest.Mock;

const request: AiAnnotateRequest = {
  chunks: [{ id: 'c0', text: 'some text' }],
  prompt: 'find names',
  annotation_type: 'highlight',
  selected_text: 'some text',
};

describe('AiService.annotate', () => {
  let service: AiService;

  beforeEach(() => {
    annotateMock.mockReset();
    service = new AiService();
  });

  it('passes the request to AiModel and returns the response arrays', async () => {
    const result = [{ chunkId: 'c0', quote: 'some' }];
    const contiguous = [{ startChunkId: 'c0', endChunkId: 'c1' }];
    annotateMock.mockResolvedValue({ data: { result, contiguous_chunks: contiguous } });

    const response = await firstValueFrom(service.annotate(request));

    expect(annotateMock).toHaveBeenCalledWith(request);
    expect(response).toEqual({ toolCalls: result, contiguousCalls: contiguous });
  });

  it('parses fields sent as JSON-encoded arrays', async () => {
    annotateMock.mockResolvedValue({
      data: { result: '[{"chunkId":"c0"}]', contiguous_chunks: '[]' },
    });

    const response = await firstValueFrom(service.annotate(request));

    expect(response).toEqual({ toolCalls: [{ chunkId: 'c0' }], contiguousCalls: [] });
  });

  it('returns empty arrays for missing, invalid or non-array fields', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    annotateMock.mockResolvedValue({ data: { result: 'not json', contiguous_chunks: '{"a":1}' } });

    const invalid = await firstValueFrom(service.annotate(request));
    annotateMock.mockResolvedValue({ data: {} });
    const missing = await firstValueFrom(service.annotate(request));

    expect(invalid).toEqual({ toolCalls: [], contiguousCalls: [] });
    expect(missing).toEqual({ toolCalls: [], contiguousCalls: [] });
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it('propagates request errors', async () => {
    const error = { response: { status: 400, data: { error: 'no active key' } } };
    annotateMock.mockRejectedValue(error);

    await expect(firstValueFrom(service.annotate(request))).rejects.toBe(error);
  });
});
