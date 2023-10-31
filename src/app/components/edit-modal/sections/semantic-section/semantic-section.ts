import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
} from '@angular/core';
import { _t } from '@net7/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SemanticGenericProvider, SemanticTextProvider } from 'src/app/models/semantic';
import { SemanticPredicateService } from 'src/app/services/semantic-predicate.service';
import {
  FormSection, FormSectionData, SemanticConfig, SemanticItem
} from 'src/app/types';

export const DEFAULT_PROVIDER_ID = 'pundit-basic';

export type SemanticSectionValue = {
  predicate: SemanticItem;
  object: SemanticItem;
  _raw?: any;
}[];

export type SemanticSectionOptions = {
  label: string;
};

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
  actions: {
    isExpanded: boolean;
  };
  disabled?: boolean;
  _raw?: any;
};

export const getObjectType = (value: string) => {
  const regex = /^(http:|https:|urn:|mailto:|file:)/g;
  if (
    (typeof value === 'string')
    && value.match(regex)) {
    return 'uri';
  }
  return 'literal';
};

@Component({
  selector: 'pnd-semantic-section',
  templateUrl: './semantic-section.html'
})
export class SemanticSectionComponent implements AfterViewInit, OnDestroy, FormSection<
  SemanticSectionValue, SemanticSectionOptions
> {
  id = 'semantic';

  labels = {
    title: _t('editmodal#semantic_label'),
    add: _t('editmodal#semantic_add'),
    remove: _t('editmodal#semantic_remove'),
    clear: _t('editmodal#semantic_clear'),
  }

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

  @Input() public data: FormSectionData<SemanticSectionValue, SemanticSectionOptions>;

  @Input() public reset$: Subject<void>;

  private destroy$: Subject<void> = new Subject();

  public rows: SemanticFormRow[] = [];

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
    this.reset$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(this.onReset);
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  init() {
    // check options label
    if (this.data.options?.label) {
      this.labels.title = this.data.options.label;
    }
    // initial value check
    const { initialValue } = this.data;
    if (Array.isArray(initialValue) && initialValue.length) {
      initialValue.forEach(({ predicate, object, _raw }) => {
        this.addRow(predicate, object, undefined, _raw);
      });
    } else {
      this.addRow();
    }
  }

  addRow(
    predicate: SemanticItem = {} as SemanticItem,
    object: SemanticItem = {} as SemanticItem,
    rowIndex?: number,
    _raw?: any,
  ) {
    const predicateProviderId = predicate.providerId || this.config.predicate.default;
    const predicateProvider = this.getProviderById(predicateProviderId, 'predicate');
    const defaultPredicate = predicateProvider.selected || predicateProvider.items[0];
    const objectProviderId = object.providerId || this.config.object.default;
    const objectValue = object.label || null;
    const rowData = {
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
        value: objectValue,
        providerId: objectProviderId,
        placeholder: _t('editmodal#semantic_object_placeholder'),
        altValue: this.getObjectAltValue(_raw)
      },
      actions: {
        isExpanded: false
      },
      disabled: this.isDisabled(_raw),
      _raw
    } as SemanticFormRow;

    // object type check
    if (objectProviderId === DEFAULT_PROVIDER_ID) {
      rowData.object.type = getObjectType(objectValue);
    }

    if (rowIndex || rowIndex === 0) {
      this.rows.splice(rowIndex + 1, 0, rowData);
    } else {
      this.rows.push(rowData);
    }
  }

  removeRow(index: number) {
    this.rows.splice(index, 1);

    // if empty add first row
    if (!this.rows.length) {
      this.addRow();
    }

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

    // closes dropdown
    currentRow.predicate.isExpanded = false;

    // trigger form change
    this.triggerChange();
  }

  onObjectChange(rowIndex, inputValue) {
    const currentRow = this.rows[rowIndex];
    const value = typeof inputValue === 'string' ? inputValue.trim() : inputValue;
    currentRow.object.value = value;
    if (currentRow.object.providerId === DEFAULT_PROVIDER_ID) {
      currentRow.object.type = getObjectType(value);
    }
    // trigger form change
    this.triggerChange();
  }

  onPredicateToggleExpand(rowIndex) {
    // update dropdowns
    this.rows.forEach((row, index) => {
      row.predicate.isExpanded = index === rowIndex
        ? !row.predicate.isExpanded
        : false;
    });
  }

  onActionsToggleExpand(rowIndex) {
    // update dropdowns
    this.rows.forEach((row, index) => {
      row.actions.isExpanded = index === rowIndex
        ? !row.actions.isExpanded
        : false;
    });
  }

  onAddClick(rowIndex) {
    this.addRow({} as SemanticItem, {} as SemanticItem, rowIndex);
    // closes dropdown
    this.rows[rowIndex].actions.isExpanded = false;
  }

  onRemoveClick(rowIndex) {
    this.removeRow(rowIndex);
    // closes dropdown
    this.rows[rowIndex].actions.isExpanded = false;
  }

  getRemoveLabel() {
    return this.rows.length === 1 ? this.labels.clear : this.labels.remove;
  }

  private isDisabled(rawData) {
    const { objectType, object } = rawData || {};
    const hasObjectUri = objectType === 'uri' && object?.source === 'search';
    const hasDate = objectType === 'date';
    return !!hasObjectUri || !!hasDate;
  }

  private getObjectAltValue(rawData) {
    const { object } = rawData || {};
    const { rdfTypes } = object || {};
    if (rdfTypes?.length) {
      return rdfTypes[0].label;
    }
    return null;
  }

  private triggerChange() {
    const formValue = [];
    const errors = [];
    this.rows.forEach((row) => {
      // old semantic annotation check
      if (row.disabled) {
        formValue.push(row._raw);
      } else {
        const rawValues = {
          objectType: row.object.type,
          object: row.object.value || null,
          predicate: (row.predicate.options
            .find((option) => option.selected) || {}).value || null
        };

        if (rawValues.predicate && rawValues.object) {
          const rowValue = {
            predicate: null as SemanticItem,
            object: null as SemanticItem,
            objectType: rawValues.objectType
          };
          ['predicate', 'object'].forEach((key: 'predicate' | 'object') => {
            const { providerId } = row[key];
            const provider = this.getProviderById(providerId, key);
            rowValue[key] = provider.get(rawValues[key]);
          });
          if (rowValue.predicate && rowValue.object?.label) {
            formValue.push(rowValue);
          }
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
    const { focus } = this.data;
    if (focus) {
      setTimeout(() => {
        const el = this.getObjectInputEl();
        if (el) {
          el.focus();
        }
      });
    }
  }

  private getObjectInputEl() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const inputs = shadowRoot.querySelectorAll('input.pnd-edit-modal__semantic-object-input');
    return inputs.length ? inputs[inputs.length - 1] as HTMLInputElement : null;
  }
}
