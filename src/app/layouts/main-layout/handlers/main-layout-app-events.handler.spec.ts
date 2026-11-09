import { Subject, BehaviorSubject } from 'rxjs';
import { MainLayoutAppEventsHandler } from './main-layout-app-events.handler';

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
});
