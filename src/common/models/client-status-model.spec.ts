import { ClientStatusModel, CLIENT_STATUS_TIMEOUT } from './client-status-model';

const URL = 'https://app.example.test/api/client-status';

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

describe('ClientStatusModel.get', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as { fetch: unknown }).fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('makes no request without a URL', async () => {
    await expect(ClientStatusModel.get('')).resolves.toBeNull();
    await expect(ClientStatusModel.get(undefined)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requests the status without cookies, referrer or cache, with a cache-busting query', async () => {
    const body = { version: 1, notices: [] };
    fetchMock.mockResolvedValue(jsonResponse(body));

    await expect(ClientStatusModel.get(URL)).resolves.toEqual(body);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`^${URL}\\?_=\\d+$`));
    expect(init).toEqual(expect.objectContaining({
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    }));
    expect(init.headers).toBeUndefined();
  });

  it('appends the cache-busting parameter to an existing query', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await ClientStatusModel.get(`${URL}?env=stage`);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\?env=stage&_=\d+$/);
  });

  it('changes the cache-busting parameter on every request', async () => {
    jest.useFakeTimers({ now: 1000 });
    fetchMock.mockResolvedValue(jsonResponse({}));
    await ClientStatusModel.get(URL);
    jest.setSystemTime(2000);
    await ClientStatusModel.get(URL);
    expect(fetchMock.mock.calls[0][0]).not.toBe(fetchMock.mock.calls[1][0]);
  });

  it.each([404, 429, 500, 503])('answers null on HTTP %i', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ version: 1, notices: [] }, status));
    await expect(ClientStatusModel.get(URL)).resolves.toBeNull();
  });

  it('answers null on invalid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true, status: 200, json: () => Promise.reject(new SyntaxError('Unexpected token'))
    });
    await expect(ClientStatusModel.get(URL)).resolves.toBeNull();
  });

  it('answers null on a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(ClientStatusModel.get(URL)).resolves.toBeNull();
  });

  it('aborts the request after the timeout and answers null', async () => {
    jest.useFakeTimers();
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      signal = init.signal!;
      return new Promise((_res, rej) => {
        signal!.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')));
      });
    });

    const result = ClientStatusModel.get(URL);
    jest.advanceTimersByTime(CLIENT_STATUS_TIMEOUT);

    await expect(result).resolves.toBeNull();
    expect(signal!.aborted).toBe(true);
  });
});
