import request$ from '../providers/rest.provider';
import list from './list';
import saveSelection from './save-selection';
import searchElements from './search-elements';
import { refreshHook } from '../auth/refresh';
import { CommunicationSettings } from '../services';

jest.mock('../providers/rest.provider', () => ({ __esModule: true, default: jest.fn(), retry$: jest.fn() }));

const requestMock = request$ as unknown as jest.Mock;

describe('ontology communication', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockReturnValue(Promise.resolve({ data: { data: [] } }));
    CommunicationSettings.apiBaseUrl = 'http://api';
  });

  it('lists the user ontologies', () => {
    list();
    expect(requestMock).toHaveBeenCalledWith('/ontologies', {
      baseURL: 'http://api',
      method: 'get',
      hooks: { after: refreshHook },
    });
  });

  it('saves the selection with a PUT', () => {
    saveSelection({ ontologies: [{ id: '1', categories: ['predicate'] }] });
    expect(requestMock).toHaveBeenCalledWith('/ontologies/selection', {
      baseURL: 'http://api',
      method: 'put',
      data: { ontologies: [{ id: '1', categories: ['predicate'] }] },
      hooks: { after: refreshHook },
    });
  });

  it('searches elements with query, comma-separated categories and limit', () => {
    searchElements({ query: 'pers', categories: ['class', 'entity'] });
    expect(requestMock).toHaveBeenCalledWith('/ontologies/elements', {
      baseURL: 'http://api',
      method: 'get',
      params: { q: 'pers', categories: 'class,entity', limit: 20 },
      hooks: { after: refreshHook },
    });
  });

  it('passes a custom limit', () => {
    searchElements({ query: 'knows', categories: ['predicate'], limit: 5 });
    expect(requestMock.mock.calls[0][1].params).toEqual({ q: 'knows', categories: 'predicate', limit: 5 });
  });
});
