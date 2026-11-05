/* eslint-disable max-lines -- Semantic section is an existing hotspot; row logic lives in semantic-section.utils.ts. */
import {
  AfterViewInit, Component, Input, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import { _t } from '@net7/core';
import { of, Subject } from 'rxjs';
import {
  catchError, debounceTime, map, switchMap, takeUntil
} from 'rxjs/operators';
import { SemanticTextProvider } from 'src/app/models/semantic';
import { OntologyService, getOntologySourceLabel } from 'src/app/services/ontology.service';
import {
  FormSection, FormSectionData, SemanticConfig, SemanticItem
} from 'src/app/types';
import { OntologyElement } from 'src/communication';
import { SvgIconComponent } from '../../../svg-icon/svg-icon';
import {
  DEFAULT_PROVIDER_ID,
  OBJECT_SEARCH_MIN_LENGTH,
  PREDICATE_SEARCH_MIN_LENGTH,
  SemanticFormRow,
  SemanticPickedObject,
  SemanticPredicateOption,
  SemanticRowValue,
  getObjectIndicator,
  getObjectType,
  getPredicateOptions,
  getRowValue,
  toPredicateOption,
} from './semantic-section.utils';

export { DEFAULT_PROVIDER_ID, getObjectType } from './semantic-section.utils';
export type { SemanticFormRow } from './semantic-section.utils';

/** Delay before a search is sent while the user types. */
const SEARCH_DEBOUNCE = 300;

/** Delay before a blurred object dropdown closes, so a click on an option lands first. */
const BLUR_CLOSE_DELAY = 200;

export type SemanticSectionValue = {
  predicate: SemanticItem;
  object: SemanticItem & {
    source?: 'search';
    elementType?: 'class' | 'entity';
    rdfTypes?: { label: string; uri: string }[];
  };
  objectType?: string;
  _raw?: any;
}[];

export type SemanticSectionOptions = {
  label: string;
};

type SearchRequest = { rowId: number; query: string };

@Component({
    selector: 'pnd-semantic-section',
    templateUrl: './semantic-section.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SvgIconComponent]
})
export class SemanticSectionComponent implements AfterViewInit, OnDestroy, FormSection<
  SemanticSectionValue, SemanticSectionOptions
> {
  private ontologyService = inject(OntologyService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  id = 'semantic';

  labels = {
    title: _t('editmodal#semantic_label'),
    add: _t('editmodal#semantic_add'),
    remove: _t('editmodal#semantic_remove'),
    clear: _t('editmodal#semantic_clear'),
    predicatePlaceholder: _t('editmodal#semantic_predicate_filter'),
    openUri: _t('editmodal#semantic_open_uri'),
    predicateHint: _t('editmodal#semantic_predicate_hint'),
    predicateNoResults: _t('editmodal#semantic_predicate_no_results'),
    types: {
      entity: _t('semantic#type_entity'),
      class: _t('semantic#type_class'),
      predicate: _t('semantic#type_predicate'),
      literal: _t('semantic#type_literal'),
      uri: _t('semantic#type_uri'),
    } as Record<string, string>,
  };

  private config: {
    object: SemanticConfig;
  } = {
      object: {
        default: DEFAULT_PROVIDER_ID,
        providers: []
      }
    };

  @Input() public data!: FormSectionData<SemanticSectionValue, SemanticSectionOptions>;

  @Input() public reset$!: Subject<void>;

  private destroy$: Subject<void> = new Subject();

  private predicateSearch$ = new Subject<SearchRequest>();

  private objectSearch$ = new Subject<SearchRequest>();

  private nextRowId = 0;

  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  public rows: SemanticFormRow[] = [];

  /** Template helpers. */
  public getPredicateOptions = getPredicateOptions;

  public getObjectIndicator = getObjectIndicator;

  public getSourceLabel = getOntologySourceLabel;

  constructor() {
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
    this.listenSearches();
    this.reset$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(this.onReset);
  }

  ngOnDestroy() {
    this.clearBlurTimer();
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
    object: SemanticSectionValue[number]['object'] = {} as SemanticItem,
    rowIndex?: number,
    _raw?: any,
  ) {
    const rowData = this.createRow(predicate, object, _raw);

    if (rowIndex || rowIndex === 0) {
      this.rows = [
        ...this.rows.slice(0, rowIndex + 1),
        rowData,
        ...this.rows.slice(rowIndex + 1)
      ];
    } else {
      this.rows = [...this.rows, rowData];
    }
  }

  removeRow(index: number) {
    const rows = this.rows.filter((_, rowIndex) => rowIndex !== index);

    // if empty add first row
    if (!rows.length) {
      this.rows = [];
      this.addRow();
    } else {
      this.rows = rows;
    }

    // trigger form change
    this.triggerChange();
  }

  // ------------------------------------ //
  // # PREDICATE
  // ------------------------------------ //

  onPredicateChange(rowIndex: number, option: SemanticPredicateOption) {
    const currentRow = this.rows[rowIndex];

    this.replaceRow(rowIndex, {
      ...currentRow,
      predicate: {
        ...currentRow.predicate,
        label: option.label,
        picked: { label: option.label, uri: option.value, sourceLabel: option.sourceLabel },
        query: '',
        remote: [],
        searched: false,
        isExpanded: false,
        isLoading: false,
      }
    }, true);
    this.blurPredicateInput(rowIndex);

    // trigger form change
    this.triggerChange();
  }

  /** Typing in the predicate field searches the predicates of the selected ontologies. */
  onPredicateQueryChange(rowIndex: number, inputValue: string) {
    const currentRow = this.rows[rowIndex];
    const query = typeof inputValue === 'string' ? inputValue : '';
    const searchable = query.trim().length >= PREDICATE_SEARCH_MIN_LENGTH
      && this.ontologyService.hasSelection(['predicate']);
    this.replaceRow(rowIndex, {
      ...currentRow,
      predicate: {
        ...currentRow.predicate, query, remote: [], searched: false, isExpanded: true, isLoading: searchable
      }
    });
    this.predicateSearch$.next({ rowId: currentRow.id, query: query.trim() });
  }

  /** Focus opens the list, with an empty search (a hint until the user types). */
  onPredicateFocus(rowIndex: number) {
    this.clearBlurTimer();
    this.setPredicateExpanded(rowIndex, true);
  }

  /** The chevron opens or closes the list. */
  onPredicateToggleExpand(rowIndex: number) {
    const expand = !this.rows[rowIndex].predicate.isExpanded;
    this.setPredicateExpanded(rowIndex, expand);
    if (expand) {
      this.focusPredicateInput(rowIndex);
    }
  }

  onPredicateKeydown(rowIndex: number, ev: KeyboardEvent) {
    const row = this.rows[rowIndex];
    if (!row?.predicate.isExpanded) return;
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      this.setPredicateExpanded(rowIndex, false);
      return;
    }
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const [first] = getPredicateOptions(row);
      if (row.predicate.query.trim() && first) {
        this.onPredicateChange(rowIndex, first);
      }
    }
  }

  /** Leaving the field without a choice keeps the selected predicate. */
  onPredicateBlur(rowIndex: number) {
    const { id } = this.rows[rowIndex];
    this.clearBlurTimer();
    this.blurTimer = setTimeout(() => {
      const index = this.rows.findIndex((row) => row.id === id);
      if (index !== -1) {
        this.setPredicateExpanded(index, false);
      }
    }, BLUR_CLOSE_DELAY);
  }

  // ------------------------------------ //
  // # OBJECT
  // ------------------------------------ //

  onObjectChange(rowIndex: number, inputValue: any) {
    const currentRow = this.rows[rowIndex];
    const value = typeof inputValue === 'string' ? inputValue.trim() : inputValue;
    const searchable = typeof value === 'string'
      && value.length >= OBJECT_SEARCH_MIN_LENGTH
      && this.ontologyService.hasSelection(['class', 'entity']);
    this.replaceRow(rowIndex, {
      ...currentRow,
      object: {
        ...currentRow.object,
        value,
        type: getObjectType(value),
        altValue: null,
        picked: null,
        options: [],
        isLoading: searchable,
        isExpanded: searchable,
      }
    }, true);
    this.objectSearch$.next({ rowId: currentRow.id, query: searchable ? value : '' });
    // trigger form change
    this.triggerChange();
  }

  onObjectPick(rowIndex: number, element: OntologyElement) {
    const currentRow = this.rows[rowIndex];
    this.replaceRow(rowIndex, {
      ...currentRow,
      object: {
        ...currentRow.object,
        value: element.label,
        type: 'uri',
        picked: {
          uri: element.uri,
          label: element.label,
          elementType: element.category === 'class' ? 'class' : 'entity',
        },
        options: [],
        isLoading: false,
        isExpanded: false,
      }
    }, true);
    this.triggerChange();
  }

  /** Keep the typed text ("Use … as …", Escape, blur). */
  onObjectKeepText(rowIndex: number) {
    this.closeObjectDropdown(rowIndex);
  }

  onObjectKeydown(rowIndex: number, ev: KeyboardEvent) {
    if (ev.key === 'Escape' && this.rows[rowIndex]?.object.isExpanded) {
      ev.stopPropagation();
      this.closeObjectDropdown(rowIndex);
    }
  }

  onObjectBlur(rowIndex: number) {
    const { id } = this.rows[rowIndex];
    this.clearBlurTimer();
    this.blurTimer = setTimeout(() => {
      const index = this.rows.findIndex((row) => row.id === id);
      if (index !== -1) {
        this.closeObjectDropdown(index);
      }
    }, BLUR_CLOSE_DELAY);
  }

  onLinkClick(ev: Event) {
    ev.stopPropagation();
  }

  // ------------------------------------ //
  // # ACTIONS
  // ------------------------------------ //

  onActionsToggleExpand(rowIndex: number) {
    // update dropdowns
    this.rows = this.rows.map((row, index) => ({
      ...row,
      actions: {
        ...row.actions,
        isExpanded: index === rowIndex ? !row.actions.isExpanded : false
      }
    }));
  }

  onAddClick(rowIndex: number) {
    this.addRow({} as SemanticItem, {} as SemanticItem, rowIndex);
    // closes dropdown
    this.replaceRow(rowIndex, {
      ...this.rows[rowIndex],
      actions: {
        ...this.rows[rowIndex].actions,
        isExpanded: false
      }
    });
  }

  onRemoveClick(rowIndex: number) {
    this.removeRow(rowIndex);
  }

  getRemoveLabel() {
    return this.rows.length === 1 ? this.labels.clear : this.labels.remove;
  }

  getUseAsLabel(value: string | null) {
    return _t('editmodal#semantic_default_option', { value: value || '' });
  }

  getTypeLabel(type: string) {
    return this.labels.types[type] || type;
  }

  // ------------------------------------ //
  // # PRIVATE
  // ------------------------------------ //

  // eslint-disable-next-line complexity -- Row construction covers new rows and every stored triple shape.
  private createRow(
    rawPredicate: SemanticItem | null,
    rawObject: SemanticSectionValue[number]['object'] | null,
    _raw?: any,
  ): SemanticFormRow {
    const predicate = rawPredicate || ({} as SemanticItem);
    // stored triples without a handled object (dates, pages) come with a null object
    const object = rawObject || ({} as SemanticSectionValue[number]['object']);
    const objectValue = object.label || null;
    const picked: SemanticPickedObject | null = object.source === 'search' && object.uri
      ? {
        uri: object.uri,
        label: object.label,
        ...(object.elementType ? { elementType: object.elementType } : {}),
        ...(object.rdfTypes?.length ? { rdfTypes: object.rdfTypes } : {}),
      }
      : null;

    this.nextRowId += 1;
    return {
      id: this.nextRowId,
      predicate: {
        // a new row has no predicate: it must be picked from the ontologies
        label: predicate.label || '',
        remote: [],
        picked: predicate.uri ? { label: predicate.label, uri: predicate.uri } : null,
        searched: false,
        query: '',
        isExpanded: false,
        isLoading: false,
      },
      object: {
        value: objectValue,
        providerId: object.providerId || this.config.object.default,
        type: picked ? 'uri' : getObjectType(objectValue),
        placeholder: _t('editmodal#semantic_object_placeholder'),
        altValue: picked?.elementType ? null : this.getObjectAltValue(_raw),
        picked,
        options: [],
        isExpanded: false,
        isLoading: false,
      },
      actions: {
        isExpanded: false
      },
      disabled: this.isDisabled(_raw),
      _raw
    };
  }

  private listenSearches() {
    this.predicateSearch$.pipe(
      debounceTime(SEARCH_DEBOUNCE),
      switchMap(({ rowId, query }) => {
        // nothing to search: back to the hint, not "no predicate found"
        if (query.length < PREDICATE_SEARCH_MIN_LENGTH || !this.ontologyService.hasSelection(['predicate'])) {
          return of({ rowId, query, results: null as OntologyElement[] | null });
        }
        return this.ontologyService.search(query, ['predicate']).pipe(
          catchError(() => of(null as OntologyElement[] | null)),
          map((results) => ({ rowId, query, results }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(({ rowId, query, results }) => {
      const index = this.rows.findIndex((row) => row.id === rowId);
      if (index === -1 || this.rows[index].predicate.query.trim() !== query) return;
      const row = this.rows[index];
      this.replaceRow(index, {
        ...row,
        predicate: {
          ...row.predicate,
          remote: (results || []).map(toPredicateOption),
          searched: results !== null,
          isLoading: false,
        }
      });
      this.changeDetectorRef.markForCheck();
    });

    this.objectSearch$.pipe(
      debounceTime(SEARCH_DEBOUNCE),
      switchMap(({ rowId, query }) => {
        if (!query) {
          return of({ rowId, query, results: [] as OntologyElement[] });
        }
        return this.ontologyService.search(query, ['class', 'entity']).pipe(
          catchError(() => of([] as OntologyElement[])),
          map((results) => ({ rowId, query, results }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(({ rowId, query, results }) => {
      const index = this.rows.findIndex((row) => row.id === rowId);
      // only the answer to the text still in the input is shown
      if (!query || index === -1 || this.rows[index].object.value !== query) return;
      const row = this.rows[index];
      this.replaceRow(index, {
        ...row,
        object: {
          ...row.object, options: results, isLoading: false, isExpanded: row.object.isExpanded
        }
      });
      this.changeDetectorRef.markForCheck();
    });
  }

  private closeObjectDropdown(rowIndex: number) {
    const row = this.rows[rowIndex];
    if (!row || (!row.object.isExpanded && !row.object.isLoading)) return;
    this.replaceRow(rowIndex, {
      ...row,
      object: {
        ...row.object, isExpanded: false, isLoading: false, options: []
      }
    });
    this.changeDetectorRef.markForCheck();
  }

  private isDisabled(rawData: any) {
    const { objectType } = rawData || {};
    return objectType === 'date';
  }

  private getObjectAltValue(rawData: any) {
    const { object } = rawData || {};
    const { rdfTypes } = object || {};
    if (rdfTypes?.length) {
      return rdfTypes[0].label;
    }
    return null;
  }

  private triggerChange() {
    const formValue: SemanticRowValue[] = [];
    this.rows.forEach((row) => {
      const value = getRowValue(row);
      if (value) {
        formValue.push(value);
      }
    });

    this.data.changed$.next({
      errors: [],
      value: formValue as unknown as SemanticSectionValue,
      id: this.id,
    });
  }

  private onReset = () => {
    this.rows = [];
    this.init();
    this.checkFocus();
    this.changeDetectorRef.markForCheck();
  };

  /**
   * Replace a row keeping it immutable. `edited` drops the stored triple, so the
   * row is saved from what the user chose instead of as it was.
   */
  private replaceRow(rowIndex: number, row: SemanticFormRow, edited = false) {
    const next = edited ? { ...row, _raw: undefined } : row;
    this.rows = this.rows.map((currentRow, index) => (index === rowIndex ? next : currentRow));
  }

  private clearBlurTimer() {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
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
  };

  private setPredicateExpanded(rowIndex: number, expand: boolean) {
    this.rows = this.rows.map((row, index) => {
      const isExpanded = index === rowIndex ? expand : false;
      if (row.predicate.isExpanded === isExpanded && !row.predicate.query) return row;
      return {
        ...row,
        predicate: {
          ...row.predicate, isExpanded, query: '', remote: [], searched: false, isLoading: false
        }
      };
    });
    this.changeDetectorRef.markForCheck();
  }

  private getPredicateInputEl(rowIndex: number) {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0] || {};
    return shadowRoot?.querySelector(`#predicate-input-${this.rows[rowIndex]?.id}`) as HTMLInputElement | null;
  }

  private focusPredicateInput(rowIndex: number) {
    setTimeout(() => this.getPredicateInputEl(rowIndex)?.focus());
  }

  private blurPredicateInput(rowIndex: number) {
    this.getPredicateInputEl(rowIndex)?.blur();
  }

  private getObjectInputEl() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const inputs = shadowRoot!.querySelectorAll('input.pnd-edit-modal__semantic-object-input');
    return inputs.length ? inputs[inputs.length - 1] as HTMLInputElement : null;
  }
}
