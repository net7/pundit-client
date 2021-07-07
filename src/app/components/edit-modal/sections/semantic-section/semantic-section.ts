import {
  AfterViewInit,
  Component,
  Input,
} from '@angular/core';
import { _t } from '@n7-frontend/core';
import { Subject } from 'rxjs';
import { SemanticGenericProvider, SemanticTextProvider } from 'src/app/models/semantic';
import { SemanticPredicateService } from 'src/app/services/semantic-predicate.service';
import {
  FormSection, FormSectionData, SemanticConfig, SemanticItem
} from 'src/app/types';

export const DEFAULT_PROVIDER_ID = 'pundit-basic';

const OBJECT_VALUE_MIN_LIMIT = 3;

export type SemanticSectionValue = {
  predicate: SemanticItem;
  object: SemanticItem;
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
    isExpanded: boolean;
  };
  object: {
    value: string;
    providerId: string;
    type?: 'literal' | 'uri';
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
    object: SemanticConfig;
  } = {
    predicate: {
      default: DEFAULT_PROVIDER_ID,
      providers: []
    },
    object: {
      default: DEFAULT_PROVIDER_ID,
      providers: []
    }
  };

  public rows: SemanticFormRow[] = [];

  @Input() public data: FormSectionData<SemanticSectionValue, SemanticSectionOptions>;

  @Input() public reset$: Subject<void>;

  constructor(
    private semanticPredicateService: SemanticPredicateService
  ) {
    // set default predicate config
    this.config.predicate.providers.push(new SemanticGenericProvider({
      id: DEFAULT_PROVIDER_ID,
      label: 'Basic Relation',
      items: this.semanticPredicateService.get()
    }));
    // set default object config
    this.config.object.providers.push(new SemanticTextProvider({
      id: DEFAULT_PROVIDER_ID,
      label: 'Basic Object',
      items: []
    }));
  }

  ngAfterViewInit() {
    this.init();
    this.checkFocus();
    this.reset$.subscribe(this.onReset);
  }

  init() {
    const { initialValue } = this.data;
    if (Array.isArray(initialValue) && initialValue.length) {
      initialValue.forEach(({ predicate, object }) => {
        this.addRow(predicate, object);
      });
    } else {
      this.addRow();
    }
  }

  addRow(
    predicate: SemanticItem = {} as SemanticItem,
    object: SemanticItem = {} as SemanticItem
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
        })),
        isExpanded: false
      },
      object: {
        value: object.label || null,
        providerId: object.providerId || this.config.object.default,
        placeholder: _t('editmodal#semantic_object_placeholder')
      }
    });
  }

  removeRow(index: number) {
    this.rows.splice(index, 1);

    // trigger form change
    this.triggerChange();
  }

  onPredicateChange(rowIndex, value) {
    const currentRow = this.rows[rowIndex];
    currentRow.predicate.options
      .forEach((option) => {
        option.selected = option.value === value;
        if (option.selected) {
          currentRow.predicate.label = option.label;
        }
      });

    // trigger form change
    this.triggerChange();
  }

  onObjectChange(rowIndex, value) {
    const currentRow = this.rows[rowIndex];
    currentRow.object.value = typeof value === 'string' ? value.trim() : value;
    if (currentRow.object.providerId === DEFAULT_PROVIDER_ID) {
      this.updateObjectType(rowIndex);
    }
    // trigger form change
    this.triggerChange();
  }

  onPredicateToggleExpand(rowIndex) {
    const currentRow = this.rows[rowIndex];
    currentRow.predicate.isExpanded = !currentRow.predicate.isExpanded;
  }

  private triggerChange() {
    const formValue = [];
    const errors = [];
    this.rows.forEach((row) => {
      const rawValues = {
        object: row.object.value || null,
        predicate: (row.predicate.options
          .find((option) => option.selected) || {}).value || null
      };

      if (rawValues.predicate && rawValues.object) {
        const rowValue = {
          predicate: null as SemanticItem,
          object: null as SemanticItem
        };
        ['predicate', 'object'].forEach((key: 'predicate' | 'object') => {
          const { providerId } = row[key];
          const provider = this.getProviderById(providerId, key);
          rowValue[key] = provider.get(rawValues[key]);
        });
        if (rowValue.object?.label && (rowValue.object?.label.length < OBJECT_VALUE_MIN_LIMIT)) {
          errors.push('minlength');
        } else if (rowValue.predicate && rowValue.object) {
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

  private getProviderById(id: string, type: 'predicate' | 'object') {
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

  private updateObjectType(rowIndex: number) {
    const currentRow = this.rows[rowIndex];
    const regex = /^(http:|https:|urn:|mailto:|file:)/g;
    currentRow.object.type = 'literal';
    if (
      (typeof currentRow.object.value === 'string')
      && currentRow.object.value.match(regex)) {
      currentRow.object.type = 'uri';
    }
  }
}
