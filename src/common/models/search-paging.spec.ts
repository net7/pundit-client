import { annotation, notebook } from 'src/communication';
import { AnnotationModel } from './annotation-model';
import { NotebookModel } from './notebook-model';

// `src/communication` is stubbed in unit tests: keep the real search builder
jest.mock('src/communication', () => ({
  annotation: { search: jest.fn(), publicSearch: jest.fn() },
  notebook: { search: jest.fn() },
  SearchAnnotationParamsBuilder: jest.requireActual('../../communication/model/builder/search')
    .SearchAnnotationParamsBuilder,
}));

const pageMetadata = [{ key: 'canonical', value: 'http://x/canonical' }];

describe('search paging', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks the sidebar search for page 1 with size 200, without from', () => {
    AnnotationModel.search('http://x', pageMetadata);

    const [params] = (annotation.search as jest.Mock).mock.calls[0];
    expect(params).toEqual(expect.objectContaining({
      page: 1, size: 200, uri: 'http://x', pageMetadata,
    }));
    expect(params).not.toHaveProperty('from');
    expect(annotation.publicSearch).not.toHaveBeenCalled();
  });

  it('sends the badge count through the anonymous public search', () => {
    AnnotationModel.publicSearch('http://x', pageMetadata);

    const [params] = (annotation.publicSearch as jest.Mock).mock.calls[0];
    expect(params).toEqual(expect.objectContaining({ page: 1, size: 200, uri: 'http://x' }));
    expect(annotation.search).not.toHaveBeenCalled();
  });

  it('asks the notebook list for page 1 with size 50', () => {
    NotebookModel.search();

    expect(notebook.search).toHaveBeenCalledWith({ page: 1, size: 50 });
  });
});
