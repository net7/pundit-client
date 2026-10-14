import { translate } from '@net7/core';
import { EditModalDS } from './edit-modal.ds';

describe('EditModalDS', () => {
  const params = {
    textQuote: 'selected text',
    sections: [
      { id: 'comment', value: 'initial comment' }
    ]
  };

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'editmodal#label',
      'editmodal#cancel',
      'editmodal#save',
      'editmodal#ai_generate',
      'editmodal#ai_save_all'
    ].forEach((key) => translate.setLangTranslation('en', key, key));
  });

  it('takes the AI action labels from i18n', () => {
    const dataSource = new EditModalDS();

    dataSource.run(params);

    expect(dataSource.out$.value.actions.aiGenerate.label).toBe('editmodal#ai_generate');
    expect(dataSource.out$.value.actions.aiSaveAll.label).toBe('editmodal#ai_save_all');
  });

  it('emits a new hidden output when closed', () => {
    const dataSource = new EditModalDS();
    const emissions: any[] = [];
    dataSource.out$.subscribe((value) => emissions.push(value));

    dataSource.run(params);
    dataSource.out$.value._setDraggableInstance({
      get: () => ({ x: 10, y: 20 }),
      set: jest.fn()
    });
    const opened = dataSource.out$.value;

    dataSource.close();

    expect(dataSource.out$.value.visible).toBe(false);
    expect(dataSource.out$.value).not.toBe(opened);
    expect(emissions.at(-1)).toBe(dataSource.out$.value);
  });

  it('emits a new output when action visibility changes', () => {
    const dataSource = new EditModalDS();
    dataSource.run(params);
    const previous = dataSource.out$.value;

    dataSource.changeActionsVisibility(true);

    expect(dataSource.out$.value.hideActions).toBe(true);
    expect(dataSource.out$.value).not.toBe(previous);
  });
});
