import { Subject, BehaviorSubject, of } from 'rxjs';
import { translate } from '@net7/core';
import en_US from 'src/app/config/i18n/en_US';
import { AppEvent } from 'src/app/event-types';
import { MainLayoutAppEventsHandler } from './main-layout-app-events.handler';
import { buildSemanticContent } from './annotation-llm-helpers.util';
import { EditModalPayloadBuilder } from './edit-modal-payload.builder';

describe('MainLayoutAppEventsHandler', () => {
  const create = () => {
    const layoutDS: any = {
      userService: { clear: jest.fn(), logout: jest.fn() },
      notebookService: { clear: jest.fn() },
      tagService: { clear: jest.fn() },
      semanticPredicateService: { clear: jest.fn() },
      ontologyService: { clear: jest.fn() },
      annotationService: { totalChanged$: new Subject() },
      hasLoaded$: new BehaviorSubject(false),
    };
    const layoutEH: any = { appEvent$: new Subject(), destroy$: new Subject() };
    return { handler: new MainLayoutAppEventsHandler(layoutDS, layoutEH) as any, layoutDS };
  };

  const predicate = { label: 'is related to', uri: 'http://www.w3.org/2004/02/skos/core#related' };

  it('clears the ontologies on logout', () => {
    const { handler, layoutDS } = create();
    handler.resetAppData({});
    expect(layoutDS.ontologyService.clear).toHaveBeenCalled();
  });

  it('reopens a search URI with its element type', () => {
    const { handler } = create();
    const triple = {
      predicate,
      objectType: 'uri',
      object: {
        uri: 'http://xmlns.com/foaf/0.1/Person', label: 'Person', source: 'search', elementType: 'class'
      },
    };
    const [row] = handler.getSemanticData([triple]);
    expect(row.object).toEqual({
      uri: 'http://xmlns.com/foaf/0.1/Person', label: 'Person', source: 'search', elementType: 'class'
    });
    expect(row.objectType).toBe('uri');
    expect(row._raw).toBe(triple);
  });

  it('keeps the rdf types of a legacy search URI', () => {
    const { handler } = create();
    const rdfTypes = [{ uri: 'http://dbpedia.org/ontology/Company', label: 'Company' }];
    const [row] = handler.getSemanticData([{
      predicate,
      objectType: 'uri',
      object: {
        uri: 'http://dbpedia.org/resource/Pearson', label: 'Pearson', source: 'search', rdfTypes
      },
    }]);
    expect(row.object.rdfTypes).toEqual(rdfTypes);
    expect(row.object.elementType).toBeUndefined();
  });

  it('reopens a triple with its element subject', () => {
    const { handler } = create();
    const subject = {
      uri: 'http://onto/Dante', label: 'Dante Alighieri', source: 'search', elementType: 'entity'
    };
    const [withSubject, withoutSubject] = handler.getSemanticData([
      { subject, predicate, objectType: 'literal', object: { text: 'Durante' } },
      { predicate, objectType: 'literal', object: { text: 'Dante' } },
    ]);
    expect(withSubject.subject).toEqual(subject);
    expect(withoutSubject.subject).toBeUndefined();
  });

  describe('an AI annotation with element subjects', () => {
    const SH = 'http://example.org/shakespeare#';
    const portia = {
      uri: `${SH}Portia`, label: 'Portia', description: 'Heiress of Belmont', elementType: 'entity' as const
    };
    const element = (name: string) => ({ uri: `${SH}${name}`, label: name, elementType: 'entity' as const });
    const content = buildSemanticContent([
      { predicate: { uri: `${SH}identifies`, label: 'identifies' }, object: element('Portia') },
      { subject: portia, predicate: { uri: `${SH}livesIn`, label: 'lives in' }, object: element('Belmont') },
    ])!;
    const save = (rows: any[]) => {
      const payload: any = {};
      EditModalPayloadBuilder.applyFormValuesToPayload(payload, { semantic: { value: rows } } as any);
      return payload.content;
    };

    it('reopens like a triple saved by hand', () => {
      const { handler } = create();
      const [fragmentRow, subjectRow] = handler.getSemanticData(content);
      expect(fragmentRow.subject).toBeUndefined();
      expect(subjectRow.subject).toEqual({ ...portia, source: 'search' });
      expect(subjectRow._raw).toBe(content[1]);
    });

    it('saves unedited rows exactly as stored', () => {
      const { handler } = create();
      expect(save(handler.getSemanticData(content))).toEqual(content);
    });

    it('keeps the subject of an edited row in its group', () => {
      const { handler } = create();
      const [, subjectRow] = handler.getSemanticData(content);
      const edited = {
        predicate: subjectRow.predicate,
        objectType: 'literal',
        object: { label: 'Belmont, Venice', uri: null },
        subject: subjectRow.subject,
      };
      expect(save([edited])).toEqual([{
        subjectType: 'uri',
        subject: content[1].subject,
        predicate: content[1].predicate,
        objectType: 'literal',
        object: { text: 'Belmont, Venice' },
      }]);
    });
  });

  it('reopens a typed URI subject', () => {
    const { handler } = create();
    const [row] = handler.getSemanticData([{
      subject: { uri: 'urn:isbn:9788817', source: 'free-text' },
      predicate, objectType: 'literal', object: { text: 'Vita nova' },
    }]);
    expect(row.subject).toEqual({ uri: 'urn:isbn:9788817', label: 'urn:isbn:9788817', source: 'free-text' });
  });

  describe('AI annotation of the page', () => {
    const pageAnnotation = {
      id: 'pending-id',
      subject: { pageContext: 'http://localhost/page', pageTitle: 'The Merchant of Venice' },
    };

    beforeAll(() => {
      translate.setDefaultLang('en');
      translate.setCurrentLang('en');
      ['editmodal#ai_label', 'toast#ai_unavailable_title', 'toast#ai_error_no_active_api_key', 'toast#ai_error_open_settings']
        .forEach((key) => translate.setLangTranslation('en', key, key));
    });

    const createForPage = (hasActiveAiKey: boolean | null, annotation: any = pageAnnotation) => {
      const { handler, layoutDS } = create();
      layoutDS.state = { hasActiveAiKey };
      layoutDS.addPendingAnnotation$ = jest.fn(() => of(annotation));
      layoutDS.removePendingAnnotation = jest.fn();
      layoutDS.anchorService = { add: jest.fn() };
      layoutDS.openEditModal = jest.fn();
      layoutDS.toastService = { warn: jest.fn() };
      return { handler, layoutDS };
    };

    it('opens the AI modal with the page title and the page annotation types', () => {
      const { handler, layoutDS } = createForPage(true);
      handler.handleAppEvent(AppEvent.AnnotationNewFullPage, 'ai');

      expect(layoutDS.openEditModal).toHaveBeenCalledWith({
        textQuote: 'The Merchant of Venice',
        sections: [{
          id: 'aiRequest',
          required: true,
          focus: true,
          options: {
            label: 'editmodal#ai_label',
            annotationTypes: ['comment', 'tags', 'semantic_annotation'],
          },
        }],
      });
      expect(en_US).toHaveProperty(['tooltip#aiRequest']);
    });

    it('titles the modal with the page URL when there is no title', () => {
      const { handler, layoutDS } = createForPage(null, {
        id: 'pending-id', subject: { pageContext: 'http://localhost/page' },
      });
      handler.handleAppEvent(AppEvent.AnnotationNewFullPage, 'ai');
      expect(layoutDS.openEditModal.mock.calls[0][0].textQuote).toBe('http://localhost/page');
    });

    it('warns and opens nothing without an active AI key', () => {
      const { handler, layoutDS } = createForPage(false);
      handler.handleAppEvent(AppEvent.AnnotationNewFullPage, 'ai');

      expect(layoutDS.openEditModal).not.toHaveBeenCalled();
      expect(layoutDS.addPendingAnnotation$).not.toHaveBeenCalled();
      expect(layoutDS.toastService.warn).toHaveBeenCalledWith(expect.objectContaining({
        title: 'toast#ai_unavailable_title',
        text: 'toast#ai_error_no_active_api_key',
        actions: [{ text: 'toast#ai_error_open_settings', payload: expect.any(String) }],
      }));
    });

    it('keeps the manual page modals', () => {
      const { handler, layoutDS } = createForPage(false);
      handler.handleAppEvent(AppEvent.AnnotationNewFullPage, 'commenting');
      const { sections } = layoutDS.openEditModal.mock.calls[0][0];
      expect(sections.map(({ id }: any) => id)).toEqual(['tags', 'notebook', 'comment']);
      expect(layoutDS.toastService.warn).not.toHaveBeenCalled();
    });
  });
});
