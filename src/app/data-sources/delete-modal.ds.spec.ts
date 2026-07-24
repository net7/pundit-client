import { translate } from '@net7/core';
import { DeleteModalDS } from './delete-modal.ds';

describe('DeleteModalDS', () => {
  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    [
      'deletemodal#label',
      'deletemodal#text',
      'deletemodal#cancel',
      'deletemodal#ok'
    ].forEach((key) => translate.setLangTranslation('en', key, key));
  });

  it('emits a new visible output when opened', () => {
    const dataSource = new DeleteModalDS();
    const emissions: any[] = [];
    dataSource.out$.subscribe((value) => emissions.push(value));
    dataSource.run();
    const closed = dataSource.out$.value;

    dataSource.open();

    expect(dataSource.out$.value.visible).toBe(true);
    expect(dataSource.out$.value).not.toBe(closed);
    expect(emissions.at(-1)).toBe(dataSource.out$.value);
  });

  it('emits a new hidden output when closed', () => {
    const dataSource = new DeleteModalDS();
    dataSource.run();
    dataSource.open();
    const opened = dataSource.out$.value;

    dataSource.close();

    expect(dataSource.out$.value.visible).toBe(false);
    expect(dataSource.out$.value).not.toBe(opened);
  });
});
