import { Injector, runInInjectionContext } from '@angular/core';
import { Subject } from 'rxjs';
import { translate } from '@net7/core';
import en from 'src/app/config/i18n/en_US';
import { ImageDataService } from 'src/app/services/image-data.service';
import { SemanticAnnotationSectionComponent } from './semantic-annotation-section';
import { buildSemanticContent } from 'src/app/layouts/main-layout/handlers/annotation-llm-helpers.util';

jest.mock('src/app/services/image-data.service', () => ({ ImageDataService: class {} }));

const predicate = { label: 'knows', uri: 'http://foaf/knows' };
const dante = {
  uri: 'http://onto/Dante', label: 'Dante Alighieri', source: 'search', elementType: 'entity'
};
const triple = (text: string, subject?: any) => ({
  ...(subject ? { subject } : {}), predicate, objectType: 'literal', object: { text }
});

describe('SemanticAnnotationSectionComponent', () => {
  const create = (id = 'saved-1') => {
    const injector = Injector.create({ providers: [{ provide: ImageDataService, useValue: {} }] });
    const component = runInInjectionContext(injector, () => new SemanticAnnotationSectionComponent());
    component.annotationId = id;
    return component;
  };

  const render = (content: any[], id?: string) => {
    const component = create(id);
    const data$ = new Subject<any>();
    component.data$ = data$;
    component.ngOnInit();
    let result: any;
    component.semantic$.subscribe((value) => { result = value; });
    data$.next({ id: component.annotationId, type: 'Linking', content });
    return result;
  };

  beforeAll(() => {
    translate.init({ defaultLang: 'en', translations: { en } });
  });

  it('shows triples without subject in one group without header', () => {
    const { groups } = render([triple('a'), triple('b')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].subject).toBeNull();
    expect(groups[0].triples).toHaveLength(2);
  });

  it('groups consecutive triples by subject, keeping the stored order', () => {
    const { groups } = render([
      triple('a'), triple('b', dante), triple('c', dante), triple('d'),
    ]);
    expect(groups.map(({ subject, triples }: any) => [subject?.uri, triples.map((t: any) => t.object.text)]))
      .toEqual([
        [undefined, ['a']],
        [dante.uri, ['b', 'c']],
        [undefined, ['d']],
      ]);
  });

  it('shows an AI annotation with element subjects in the same "About" groups', () => {
    const SH = 'http://example.org/shakespeare#';
    const portia = { uri: `${SH}Portia`, label: 'Portia', elementType: 'entity' as const };
    const bassanio = { uri: `${SH}Bassanio`, label: 'Bassanio', elementType: 'entity' as const };
    const knowsAi = { uri: predicate.uri, label: predicate.label };
    const { groups } = render(buildSemanticContent([
      { predicate: knowsAi, object: { text: 'a' } },
      { subject: portia, predicate: knowsAi, object: { text: 'b' } },
      { subject: portia, predicate: knowsAi, object: { text: 'c' } },
      { subject: bassanio, predicate: knowsAi, object: { text: 'd' } },
    ])!);
    expect(groups.map(({ subject, triples }: any) => [subject?.label, triples.map((t: any) => t.object.text)]))
      .toEqual([
        [undefined, ['a']],
        ['Portia', ['b', 'c']],
        ['Bassanio', ['d']],
      ]);
  });

  it('keeps the predicate URI, to link the predicate label', () => {
    const { groups } = render([triple('a')]);
    expect(groups[0].triples[0].predicate).toEqual({ label: 'knows', uri: 'http://foaf/knows' });
  });

  describe('discarding a triple of an AI preview', () => {
    it('allows it on a preview with more than one triple', () => {
      expect(render([triple('a'), triple('b')], 'ai-preview-0').canDiscardTriple).toBe(true);
    });

    it('never allows it on the last triple', () => {
      expect(render([triple('a')], 'ai-preview-0').canDiscardTriple).toBe(false);
    });

    it('never allows it on a saved annotation', () => {
      expect(render([triple('a'), triple('b')], 'saved-1').canDiscardTriple).toBe(false);
    });

    it('keeps the index of each triple in the content across subject groups', () => {
      const { groups } = render([
        triple('a'), triple('b', dante), triple('c', dante), triple('d'),
      ], 'ai-preview-0');
      expect(groups.map(({ triples }: any) => triples.map((t: any) => t.index)))
        .toEqual([[0], [1, 2], [3]]);
    });

    it('emits the triple index without toggling the card', () => {
      const component = create('ai-preview-0');
      component.emit = jest.fn();
      const ev = { stopImmediatePropagation: jest.fn() } as any;
      component.onDiscardTriple(ev, 2);
      expect(ev.stopImmediatePropagation).toHaveBeenCalled();
      expect(component.emit).toHaveBeenCalledWith('click', { id: 'ai-preview-0', source: 'discard-triple', index: 2 });
    });
  });
});
