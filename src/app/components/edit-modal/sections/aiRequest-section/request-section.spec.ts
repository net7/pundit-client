import { translate } from '@net7/core';
import { TestBed } from '@angular/core/testing';
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
