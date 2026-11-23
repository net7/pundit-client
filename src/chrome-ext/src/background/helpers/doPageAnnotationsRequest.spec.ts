import { AnnotationModel } from '../../../../common/models';
import { ChromeExtStorage } from '../storage';
import { doPageAnnotationsRequest } from './doPageAnnotationsRequest';

jest.mock('../../../../common/models', () => ({
  AnnotationModel: { search: jest.fn(), publicSearch: jest.fn() },
}));
jest.mock('../storage', () => ({
  ChromeExtStorage: { get: jest.fn(), set: jest.fn() },
}));

const publicSearchMock = AnnotationModel.publicSearch as jest.Mock;
const storageGet = ChromeExtStorage.get as jest.Mock;
const storageSet = ChromeExtStorage.set as jest.Mock;

const payload = { pageContext: 'http://x', pageMetadata: null, active: false };

describe('doPageAnnotationsRequest (badge count)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storageGet.mockResolvedValue([]);
    storageSet.mockImplementation((_key, value) => Promise.resolve(value));
  });

  it('counts the public annotations with the anonymous search and caches the total', async () => {
    publicSearchMock.mockResolvedValue({ data: { stats: { total: 7 } } });

    await expect(doPageAnnotationsRequest(1, payload)).resolves.toEqual({ tabId: 1, total: 7 });

    expect(publicSearchMock).toHaveBeenCalledWith('http://x', null);
    expect(AnnotationModel.search).not.toHaveBeenCalled();
    expect(storageSet).toHaveBeenCalledWith('page-annotations-cache', [
      expect.objectContaining({ key: 'http://x', value: 7 }),
    ]);
  });

  it('answers from the cache without a request', async () => {
    storageGet.mockResolvedValue([{ key: 'http://x', value: 3, created: new Date().toISOString() }]);

    await expect(doPageAnnotationsRequest(1, payload)).resolves.toEqual({ tabId: 1, total: 3 });

    expect(publicSearchMock).not.toHaveBeenCalled();
  });

  it('rejects when the search fails, caching nothing', async () => {
    const error = { response: { status: 419 } };
    publicSearchMock.mockRejectedValue(error);

    await expect(doPageAnnotationsRequest(1, payload)).rejects.toBe(error);

    expect(storageSet).not.toHaveBeenCalled();
  });
});
