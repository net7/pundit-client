import request$ from '../providers/rest.provider';
import annotate from './annotate';
import { refreshHook } from '../auth/refresh';
import { AiAnnotateRequest } from '../model';
import { CommunicationSettings } from '../services';

jest.mock('../providers/rest.provider', () => ({ __esModule: true, default: jest.fn(), retry$: jest.fn() }));

const requestMock = request$ as unknown as jest.Mock;

describe('ai annotate', () => {
  beforeEach(() => {
    requestMock.mockReset();
    CommunicationSettings.apiBaseUrl = 'http://api';
  });

  it('posts the request to /ai/annotate on the api base url with the refresh hook', () => {
    const response = Promise.resolve({ data: { result: [], contiguous_chunks: [] } });
    requestMock.mockReturnValue(response);
    const data: AiAnnotateRequest = {
      chunks: [{ id: 'c0', text: 'some text' }],
      prompt: 'find names',
      annotation_type: 'highlight',
      selected_text: 'some text',
    };

    const result = annotate(data);

    expect(requestMock).toHaveBeenCalledWith('/ai/annotate', {
      baseURL: 'http://api',
      method: 'post',
      data,
      hooks: { after: refreshHook },
    });
    expect(result).toBe(response);
  });
});
