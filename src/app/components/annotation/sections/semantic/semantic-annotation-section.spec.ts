import { Injector, runInInjectionContext } from '@angular/core';
import { Subject } from 'rxjs';
import { translate } from '@net7/core';
import en from 'src/app/config/i18n/en_US';
import { ImageDataService } from 'src/app/services/image-data.service';
import { SemanticAnnotationSectionComponent } from './semantic-annotation-section';

jest.mock('src/app/services/image-data.service', () => ({ ImageDataService: class {} }));

const predicate = { label: 'knows', uri: 'http://foaf/knows' };
const dante = {
  uri: 'http://onto/Dante', label: 'Dante Alighieri', source: 'search', elementType: 'entity'
};
const triple = (text: string, subject?: any) => ({
  ...(subject ? { subject } : {}), predicate, objectType: 'literal', object: { text }
});

describe('SemanticAnnotationSectionComponent', () => {
  const render = (content: any[]) => {
    const injector = Injector.create({ providers: [{ provide: ImageDataService, useValue: {} }] });
    const component = runInInjectionContext(injector, () => new SemanticAnnotationSectionComponent());
    const data$ = new Subject<any>();
    component.data$ = data$;
    component.ngOnInit();
    let result: any;
    component.semantic$.subscribe((value) => { result = value; });
    data$.next({ type: 'Linking', content });
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

  it('keeps the predicate URI, to link the predicate label', () => {
    const { groups } = render([triple('a')]);
    expect(groups[0].triples[0].predicate).toEqual({ label: 'knows', uri: 'http://foaf/knows' });
  });
});
