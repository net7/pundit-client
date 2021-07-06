import {
  AfterViewInit,
  Component,
  Input,
} from '@angular/core';
import { Subject } from 'rxjs';
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
  }

  private rows: SemanticFormRow[];

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
    // defaults
    this.config.predicate.default = DEFAULT_ID;
    this.config.subject.default = DEFAULT_ID;
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
        providerId: predicate.providerId || defaultPredicate.providerId,
        options: predicateProvider.items.map(({ label, uri }) => ({
          label,
          value: uri,
          selected: uri === (predicate.uri || defaultPredicate.uri)
        }))
      },
      subject: {
        value: subject.label || null,
        providerId: subject.providerId || this.config.subject.default
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
    this.rows[rowIndex].subject.value = value;

    this.triggerChange();
  }

  private triggerChange() {
    const formValue = [];
    const errors = [];
    this.rows.forEach((row) => {
      const subjectValue = row.subject.value || null;
      const predicateValue = (row.predicate.options
        .find((option) => option.selected) || {}).value || null;

      if (subjectValue && (subjectValue.length < SUBJECT_VALUE_MIN_LIMIT)) {
        errors.push('minlength');
      } else if (predicateValue && subjectValue) {
        const rowValue = {
          predicate: null,
          subject: null
        };
        ['predicate', 'subject'].forEach((key: 'predicate' | 'subject') => {
          const { providerId } = row[key];
          const provider = this.getProviderById(providerId, key);
          rowValue[key] = provider.get(predicateValue);
        });
        if (rowValue.predicate && rowValue.subject) {
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
}
