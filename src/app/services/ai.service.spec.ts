import { firstValueFrom } from 'rxjs';
import { AiModel } from 'src/common/models';
import { AiAnnotateRequest } from 'src/communication';
import { AiService } from './ai.service';

jest.mock('src/common/models', () => ({ AiModel: { annotate: jest.fn() } }));

const annotateMock = AiModel.annotate as jest.Mock;

const request: AiAnnotateRequest = {
  segments: [{ id: 'c1', text: 'some text' }],
  prompt: 'find names',
  annotation_type: 'highlight',
};

describe('AiService.annotate', () => {
  let service: AiService;

  beforeEach(() => {
    annotateMock.mockReset();
    service = new AiService();
  });

  it('passes the request to AiModel and returns the annotations as received', async () => {
    const annotations = [
      {
        type: 'highlight',
        target: {
          segment: 'c1', end_segment: null, exact: 'some', prefix: '', suffix: ' text', start: 0, end: 4,
        },
      },
    ];
    annotateMock.mockResolvedValue({ data: { annotations } });

    const response = await firstValueFrom(service.annotate(request));

    expect(annotateMock).toHaveBeenCalledWith(request);
    expect(response).toBe(annotations);
  });

  it.each([
    ['missing', {}],
    ['null', { annotations: null }],
    ['a string', { annotations: '[]' }],
    ['an object', { annotations: { a: 1 } }],
    ['the old shape', { result: [{ chunkId: 'c1', quote: 'some' }], contiguous_chunks: [] }],
  ])('returns no annotations when the list is %s', async (_label, data) => {
    annotateMock.mockResolvedValue({ data });

    expect(await firstValueFrom(service.annotate(request))).toEqual([]);
  });

  it('propagates request errors', async () => {
    const error = { response: { status: 400, data: { error: 'no active key' } } };
    annotateMock.mockRejectedValue(error);

    await expect(firstValueFrom(service.annotate(request))).rejects.toBe(error);
  });
});
