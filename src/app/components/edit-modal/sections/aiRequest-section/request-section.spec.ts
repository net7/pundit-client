import { translate } from '@net7/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { AiRequestSectionComponent } from './request-section';

const KEYS = [
  'editmodal#ai_placeholder',
  'editmodal#ai_annotation_type',
  'editmodal#ai_type_comment',
  'editmodal#ai_type_highlight',
  'editmodal#ai_type_tags',
  'editmodal#ai_type_semantic',
];

describe('AiRequestSectionComponent > i18n', () => {
  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    KEYS.forEach((key) => translate.setLangTranslation('en', key, key));
  });

  it('takes placeholder, type label and type names from i18n keys that exist in en_US', () => {
    const component = TestBed.createComponent(AiRequestSectionComponent).componentInstance;

    expect(component.placeholder).toBe('editmodal#ai_placeholder');
    expect(component.annotationTypeLabel).toBe('editmodal#ai_annotation_type');
    expect(component.annotationTypes).toEqual([
      { value: 'comment', label: 'editmodal#ai_type_comment' },
      { value: 'highlight', label: 'editmodal#ai_type_highlight' },
      { value: 'tags', label: 'editmodal#ai_type_tags' },
      { value: 'semantic_annotation', label: 'editmodal#ai_type_semantic' },
    ]);
    KEYS.forEach((key) => expect(en_US).toHaveProperty([key]));
  });

  it('has the section label passed by the tooltip handler in en_US', () => {
    expect(en_US).toHaveProperty(['editmodal#ai_label'], 'Instructions for the AI');
  });
});

describe('AiRequestSectionComponent > offered annotation types', () => {
  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    KEYS.forEach((key) => translate.setLangTranslation('en', key, key));
  });

  const create = (options: any, initialValue?: any) => {
    const component = TestBed.createComponent(AiRequestSectionComponent).componentInstance;
    component.data = { options, initialValue, changed$: new Subject() } as any;
    component.ngOnInit();
    return component;
  };

  it('offers all four types with highlight selected without annotationTypes', () => {
    const component = create({ label: 'AI' });
    expect(component.annotationTypes.map(({ value }) => value))
      .toEqual(['comment', 'highlight', 'tags', 'semantic_annotation']);
    expect(component.annotationType).toBe('highlight');
  });

  it('offers the listed types in their order, the first selected', () => {
    const component = create({ label: 'AI', annotationTypes: ['comment', 'tags', 'semantic_annotation'] });
    expect(component.annotationTypes).toEqual([
      { value: 'comment', label: 'editmodal#ai_type_comment' },
      { value: 'tags', label: 'editmodal#ai_type_tags' },
      { value: 'semantic_annotation', label: 'editmodal#ai_type_semantic' },
    ]);
    expect(component.annotationType).toBe('comment');
  });

  it('keeps the initial type over the default', () => {
    const component = create(
      { label: 'AI', annotationTypes: ['comment', 'tags', 'semantic_annotation'] },
      { prompt: 'task', annotationType: 'tags' },
    );
    expect(component.annotationType).toBe('tags');
    expect(component.value).toBe('task');
  });

  it('emits the default type with the prompt', () => {
    const component = create({ label: 'AI', annotationTypes: ['comment', 'tags', 'semantic_annotation'] });
    const emitted: any[] = [];
    component.data.changed$.subscribe((change: any) => emitted.push(change));
    component.onInput('summarize the page');
    expect(emitted[0].value).toEqual({ prompt: 'summarize the page', annotationType: 'comment' });
  });
});
