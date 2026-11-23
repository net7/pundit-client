import { firstValueFrom, NEVER, of, ReplaySubject } from 'rxjs';
import { AnnotationModel } from 'src/common/models';
import { MainLayoutDS } from './main-layout.ds';

jest.mock('src/common/models', () => ({
  AnnotationModel: { search: jest.fn() },
  SemanticPredicateModel: {},
}));
jest.mock('src/common/models/tag-model', () => ({ TagModel: {} }));

const searchMock = AnnotationModel.search as jest.Mock;

describe('MainLayoutDS annotations search', () => {
  let ds: MainLayoutDS;
  let failed$: ReplaySubject<void>;
  let annotationService: { load: jest.Mock; getAnnotations: jest.Mock; totalChanged$: { next: jest.Mock } };

  const init = (documentInfo$: unknown) => {
    failed$ = new ReplaySubject<void>(1);
    annotationService = {
      load: jest.fn(),
      getAnnotations: jest.fn(() => []),
      totalChanged$: { next: jest.fn() },
    };
    ds = new MainLayoutDS();
    ds.onInit({
      annotationService,
      pdfService: { failed$ },
      documentInfoService: { get: () => documentInfo$ },
      notebookService: { load: jest.fn() },
      userService: { load: jest.fn() },
      socialService: { load: jest.fn() },
      replyService: { load: jest.fn() },
      anchorService: { load: jest.fn() },
    });
  };

  beforeEach(() => jest.clearAllMocks());

  it('skips the search and ends the loading when the PDF cannot be loaded', async () => {
    // the PDF document info never arrives: the document failed to load
    init(NEVER);
    failed$.next();

    await expect(firstValueFrom(ds.getUserAnnotations())).resolves.toBeNull();

    expect(searchMock).not.toHaveBeenCalled();
    expect(annotationService.totalChanged$.next).toHaveBeenCalledWith(0);
    expect(ds.hasLoaded$.getValue()).toBe(true);
  });

  it('searches the document annotations when the document info arrives', async () => {
    const searchData = {
      users: [], annotations: [], notebooks: [], socials: [], replies: [],
    };
    searchMock.mockResolvedValue({ data: searchData });
    init(of({ pageTitle: 't', pageContext: 'http://x/doc.pdf', pageMetadata: [] }));

    await firstValueFrom(ds.getUserAnnotations());

    expect(searchMock).toHaveBeenCalledWith('http://x/doc.pdf', []);
    expect(annotationService.load).toHaveBeenCalledWith([]);
    expect(ds.hasLoaded$.getValue()).toBe(true);
  });
});
