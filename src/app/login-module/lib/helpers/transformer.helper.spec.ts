import { AxiosError } from 'axios';
import { transformFromHttpError, transformFromHttpSuccess } from './transformer.helper';

jest.mock('../../../../common/models', () => ({ AuthModel: { sso: jest.fn() } }));

const httpError = (status: number, data?: object) => ({ response: { status, data } } as AxiosError);

describe('transformer helper', () => {
  it('reads the user from a session answer, without token fields', () => {
    const user = { id: '01HX', username: 'Ada' };

    expect(transformFromHttpSuccess({ userinfo: user, csrf_token: 't' }, 'sso')).toEqual({ user, source: 'sso' });
    expect(transformFromHttpSuccess({ userinfo: JSON.stringify(user) }, 'sso')).toEqual({ user, source: 'sso' });
  });

  it('reads a guest 401 {message: Unauthenticated.} as Unauthorized', () => {
    expect(transformFromHttpError(httpError(401, { message: 'Unauthenticated.' }), 'sso'))
      .toEqual({ error: 'Unauthorized', source: 'sso' });
  });

  it('keeps the error code of the auth routes', () => {
    expect(transformFromHttpError(httpError(401, { error: 'Unauthorized' }), 'login'))
      .toEqual({ error: 'Unauthorized', source: 'login' });
    expect(transformFromHttpError(httpError(422, { error: 'must_verify_email' }), 'login'))
      .toEqual({ error: 'must_verify_email', source: 'login' });
  });

  it('reports an internal error without a response', () => {
    expect(transformFromHttpError({} as AxiosError, 'sso')).toEqual({ error: 'Internal server error', source: 'sso' });
  });
});
