import {
  AfterViewInit,
  Component,
  Input,
} from '@angular/core';
import { _t } from '@n7-frontend/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  FormSection, FormSectionData, SemanticConfig, SemanticItem
} from 'src/app/types';
import { config as semanticSectionConfig, DEFAULT_ID } from './semantic-section.config';

const SUBJECT_VALUE_MIN_LIMIT = 3;

export type SemanticSectionValue = {
  predicate: SemanticItem;
  subject: SemanticItem;
}[];

export type SemanticSectionOptions = {};

export type SemanticFormRow = {
  predicate: {
    label: string;
    providerId: string;
    options: {
      label: string;
      value: string;
      selected?: boolean;
    }[];
  };
  subject: {
    value: string;
    providerId: string;
    placeholder?: string;
  };
};

@Component({
  selector: 'pnd-semantic-section',
  templateUrl: './semantic-section.html'
})
export class SemanticSectionComponent implements AfterViewInit, FormSection<
  SemanticSectionValue, SemanticSectionOptions
> {
  id = 'semantic';

  private config: {
    predicate: SemanticConfig;
    subject: SemanticConfig;
  } = {
    predicate: {
      default: DEFAULT_ID,
      providers: []
    },
    subject: {
      default: DEFAULT_ID,
      providers: []
    }
  };

  private search$: Subject<{
    rowIndex: number;
    value: string;
  }> = new Subject();

  public rows: SemanticFormRow[] = [];

  @Input() public data: FormSectionData<SemanticSectionValue, SemanticSectionOptions>;

  @Input() public reset$: Subject<void>;

  constructor() {
    // predicate providers config
    semanticSectionConfig.predicate.forEach(({
      id, label, items, provider: ProviderKlass
    }) => {
      const provider = new ProviderKlass(id, label, items);
      this.config.predicate.providers.push(provider);
    });
    // subject providers config
    semanticSectionConfig.subject.forEach(({
      id, label, items, provider: ProviderKlass
    }) => {
      const provider = new ProviderKlass(id, label, items);
      this.config.subject.providers.push(provider);
    });

    // listen object search
    this.listenObjectSearch();
  }

  ngAfterViewInit() {
    this.init();
    this.checkFocus();
    this.reset$.subscribe(this.onReset);
  }

  init() {
    const { initialValue } = this.data;
    if (Array.isArray(initialValue) && initialValue.length) {
      initialValue.forEach(({ predicate, subject }) => {
        this.addRow(predicate, subject);
      });
    } else {
      this.addRow();
    }
  }

  addRow(
    predicate: SemanticItem = {} as SemanticItem,
    subject: SemanticItem = {} as SemanticItem
  ) {
    const predicateProviderId = predicate.providerId || this.config.predicate.default;
    const predicateProvider = this.getProviderById(predicateProviderId, 'predicate');
    const defaultPredicate = predicateProvider.selected || predicateProvider.items[0];
    this.rows.push({
      predicate: {
        label: predicate.label || defaultPredicate.label,
        providerId: predicateProviderId,
        options: predicateProvider.items.map(({ label, uri }) => ({
          label,
          value: uri,
          selected: uri === (predicate.uri || defaultPredicate.uri)
        }))
      },
      subject: {
        value: subject.label || null,
        providerId: subject.providerId || this.config.subject.default,
        placeholder: _t('editmodal#semantic_subject_placeholder')
      }
    });
  }

  removeRow(index: number) {
    this.rows.splice(index, 1);
  }

  onPredicateChange(rowIndex, value) {
    this.rows[rowIndex].predicate.options
      .forEach((option) => {
        option.selected = option.value === value;
      });

    this.triggerChange();
  }

  onSubjectChange(rowIndex, value) {
    const currentRow = this.rows[rowIndex];
    // default value for free text input
    currentRow.subject.value = value;
    // update autocomplete search change
    this.search$.next({ rowIndex, value });
    // trigger form change
    this.triggerChange();
  }

  private triggerChange() {
    const formValue = [];
    const errors = [];
    this.rows.forEach((row) => {
      const rawValues = {
        subject: row.subject.value || null,
        predicate: (row.predicate.options
          .find((option) => option.selected) || {}).value || null
      };

      if (rawValues.predicate && rawValues.subject) {
        const rowValue = {
          predicate: null as SemanticItem,
          subject: null as SemanticItem
        };
        ['predicate', 'subject'].forEach((key: 'predicate' | 'subject') => {
          const { providerId } = row[key];
          const provider = this.getProviderById(providerId, key);
          rowValue[key] = provider.get(rawValues[key]);
        });
        if (rowValue.subject?.label && (rowValue.subject?.label.length < SUBJECT_VALUE_MIN_LIMIT)) {
          errors.push('minlength');
        } else if (rowValue.predicate && rowValue.subject) {
          formValue.push(rowValue);
        }
      }
    });

    this.data.changed$.next({
      errors,
      value: formValue,
      id: this.id,
    });
  }

  private getProviderById(id: string, type: 'predicate' | 'subject') {
    return this.config[type].providers
      .find((provider) => provider.id === id) || null;
  }

  private onReset = () => {
    this.rows = [];
    this.init();
    this.checkFocus();
  }

  private checkFocus = () => {
    // TODO
  }

  private listenObjectSearch() {
    this.search$.pipe(
      debounceTime(500)
    ).subscribe(({ rowIndex, value }) => {
      const currentRow = this.rows[rowIndex];
      const provider = this.getProviderById(currentRow.subject.providerId, 'subject');
      provider.search(value).subscribe((items) => {
        console.warn('FIXME: completare logica search', value, items);
      });
    });
  }
}
