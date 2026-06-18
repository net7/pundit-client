import { AnnotationEH } from './annotation.eh';
import { BehaviorSubject, Subject } from 'rxjs';
import { AnnotationEvent, getEventType } from '../event-types';

describe('AnnotationEH', () => {
  let root: HTMLElement;
  let handler: AnnotationEH;
  let annotationService: { getAnnotationById: jest.Mock; updateAnnotationState: jest.Mock };

  beforeEach(() => {
    root = document.createElement('pnd-root');
    root.attachShadow({ mode: 'open' });
    document.body.appendChild(root);

    annotationService = {
      getAnnotationById: jest.fn(),
      updateAnnotationState: jest.fn()
    };

    handler = new AnnotationEH();
    (handler as any).hostId = 'annotation';
    (handler as any).outerEvents$ = new Subject();
    handler.annotationService = annotationService as any;
  });

  afterEach(() => {
    root.remove();
  });

  it('handles document clicks on SVG targets whose className is not a string', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);
    handler.listenDocumentClicks('annotation-id');

    expect(() => {
      svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }).not.toThrow();
    expect(annotationService.updateAnnotationState)
      .toHaveBeenCalledWith('annotation-id', { activeMenu: undefined });
    svg.remove();
  });

  it('normalizes SVGAnimatedString class names', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'pnd-icon');

    expect((handler as any).getElementClassName(svg)).toBe('pnd-icon');
  });

  it('emits delete when an annotation delete menu action is clicked', () => {
    const emitted: any[] = [];
    annotationService.getAnnotationById.mockReturnValue({
      id: 'annotation-id',
      state$: new BehaviorSubject({})
    });
    handler.out$.subscribe((event) => emitted.push(event));

    handler.listen();
    handler.emitInner(getEventType(AnnotationEvent.Click), {
      id: 'annotation-id',
      source: 'action-delete'
    });

    expect(annotationService.updateAnnotationState)
      .toHaveBeenCalledWith('annotation-id', { activeMenu: undefined });
    expect(emitted.some((event) => (
      event.type.endsWith(`.${getEventType(AnnotationEvent.Delete)}`)
      && event.payload === 'annotation-id'
    ))).toBe(true);
  });
});
