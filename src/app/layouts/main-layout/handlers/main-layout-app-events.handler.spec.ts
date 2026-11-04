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

  it('clears the ontologies on logout', () => {
    const { handler, layoutDS } = create();
    handler.resetAppData({});
    expect(layoutDS.ontologyService.clear).toHaveBeenCalled();
  });
});
