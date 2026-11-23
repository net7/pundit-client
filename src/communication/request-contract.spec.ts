import request$ from './providers/rest.provider';
import { withoutFields } from './providers/without-fields';
import * as annotation from './annotation';
import * as notebook from './notebook';
import * as reply from './reply';
import * as social from './social';
import {
  AnnotationAttributes, NotebookAttributes, ReplyAttributes, SearchAnnotationParamsBuilder,
  SearchNotebookParamsBuilder, SocialAttributes
} from './model';
import { CommunicationSettings } from './services';

jest.mock('./providers/rest.provider', () => ({ __esModule: true, default: jest.fn(), retry$: jest.fn() }));

const requestMock = request$ as unknown as jest.Mock;
const sentBody = () => requestMock.mock.calls[0][1].data;

const commentAnnotation: AnnotationAttributes = {
  type: 'Commenting',
  notebookId: 'nb',
  userId: 'u1',
  serializedBy: 'pundit-client',
  subject: { pageTitle: 'p', pageContext: 'http://x', source: 'http://x' } as any,
  content: { comment: 'hello' },
};

describe('withoutFields', () => {
  it('returns a shallow copy without the named fields', () => {
    const data = { a: 1, b: 2, c: { d: 3 } };

    const copy = withoutFields(data, 'b');

    expect(copy).toEqual({ a: 1, c: { d: 3 } });
    expect(data).toEqual({ a: 1, b: 2, c: { d: 3 } });
    expect(copy.c).toBe(data.c);
  });
});

describe('request bodies', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockReturnValue(Promise.resolve({ data: { id: '01HX' } }));
    CommunicationSettings.apiBaseUrl = 'http://app/api';
  });

  it('creates an annotation without userId', () => {
    annotation.create(commentAnnotation);

    expect(requestMock).toHaveBeenCalledWith('/annotation', expect.objectContaining({ method: 'post' }));
    expect(sentBody()).toEqual(withoutFields(commentAnnotation, 'userId'));
    expect(sentBody()).not.toHaveProperty('userId');
  });

  it('updates an annotation without userId', () => {
    annotation.update('01HX', commentAnnotation);

    expect(requestMock.mock.calls[0][0]).toBe('/annotation/01HX');
    expect(sentBody()).not.toHaveProperty('userId');
    expect(sentBody()).toHaveProperty('content', { comment: 'hello' });
  });

  describe('notebooks', () => {
    const shared: NotebookAttributes & Record<string, unknown> = {
      label: 'Renamed',
      sharingMode: 'private',
      userId: 'u1',
      userWithReadAccess: ['r@example.org'],
      userWithWriteAccess: ['w@example.org'],
      userWithPendingReadAccess: ['p@example.org'],
    };

    it('creates a notebook with exactly {label, sharingMode}', () => {
      notebook.create(shared);

      expect(requestMock.mock.calls[0][0]).toBe('/notebook');
      expect(sentBody()).toEqual({ label: 'Renamed', sharingMode: 'private' });
    });

    it('renames a shared notebook with exactly {label, sharingMode}', () => {
      notebook.update('01HX', shared);

      expect(requestMock).toHaveBeenCalledWith('/notebook/01HX', expect.objectContaining({ method: 'put' }));
      expect(sentBody()).toEqual({ label: 'Renamed', sharingMode: 'private' });
    });
  });

  describe('replies', () => {
    const data: ReplyAttributes = {
      userId: 'u1', annotationId: '01HXANN', type: 'Comment', comment: 'a reply', parentId: '01HXPARENT',
    };

    it('creates a reply without userId and parentId', () => {
      reply.create(data);

      expect(sentBody()).toEqual({ annotationId: '01HXANN', type: 'Comment', comment: 'a reply' });
    });

    it('updates a reply with {comment, type, annotationId}', () => {
      reply.update('01HXREPLY', data);

      expect(requestMock).toHaveBeenCalledWith('/reply/01HXREPLY', expect.objectContaining({ method: 'put' }));
      expect(sentBody()).toEqual({ comment: 'a reply', type: 'Comment', annotationId: '01HXANN' });
    });

    it('updates a reply with only the comment when nothing else is given', () => {
      reply.update('01HXREPLY', { comment: 'only' } as ReplyAttributes);

      expect(sentBody()).toEqual({ comment: 'only' });
    });
  });

  describe('reactions', () => {
    const data: SocialAttributes = {
      userId: 'u1', annotationId: '01HXANN', type: 'Like', parentId: '01HXREPLY',
    };

    it('likes without userId, keeping the reply as parentId', () => {
      social.create(data);

      expect(requestMock.mock.calls[0][0]).toBe('/social/do');
      expect(sentBody()).toEqual({ annotationId: '01HXANN', type: 'Like', parentId: '01HXREPLY' });
    });

    it('undoes without userId, keeping the reply as parentId', () => {
      social.remove(data);

      expect(requestMock.mock.calls[0][0]).toBe('/social/undo');
      expect(sentBody()).toEqual({ annotationId: '01HXANN', type: 'Like', parentId: '01HXREPLY' });
    });
  });

  it('sends the public search as anonymous', () => {
    annotation.publicSearch({ uri: 'http://x' });

    expect(requestMock).toHaveBeenCalledWith('/annotation/search', expect.objectContaining({
      method: 'post', anonymous: true,
    }));
  });

  it('sends the session search with the session', () => {
    annotation.search({ uri: 'http://x' });

    expect(requestMock.mock.calls[0][1]).not.toHaveProperty('anonymous');
  });
});

describe('search paging', () => {
  it('builds annotation search params with page and size, no from', () => {
    const params = new SearchAnnotationParamsBuilder().page(1).size(200).uri('http://x').build();

    expect(params).toEqual(expect.objectContaining({ page: 1, size: 200, uri: 'http://x' }));
    expect(params).not.toHaveProperty('from');
  });

  it('builds notebook search params with page and size, no from', () => {
    const params = new SearchNotebookParamsBuilder().page(1).size(50).build();

    expect(params).toEqual(expect.objectContaining({ page: 1, size: 50 }));
    expect(params).not.toHaveProperty('from');
  });
});
