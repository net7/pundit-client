/* eslint-disable max-lines -- Semantic section is an existing hotspot; row logic lives in semantic-section.utils.ts. */
import {
  AfterViewInit, Component, Input, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _t } from '@net7/core';
import { of, Subject, Subscription } from 'rxjs';
import {
  catchError, debounceTime, distinctUntilChanged, map, skip, switchMap, takeUntil
} from 'rxjs/operators';
import { SemanticTextProvider } from 'src/app/models/semantic';
import { OntologyService, getOntologySourceLabel } from 'src/app/services/ontology.service';
import {
  FormSection, FormSectionData, SemanticConfig, SemanticItem
} from 'src/app/types';
import { OntologyElement } from 'src/communication';
import { SvgIconComponent } from '../../../svg-icon/svg-icon';
import { SemanticSubjectFieldComponent, SemanticSubjectFieldEvent } from './subject-field/subject-field';
import {
  DEFAULT_PROVIDER_ID,
  OBJECT_SEARCH_MIN_LENGTH,
  PREDICATE_DEFAULT_LIMIT,
  PREDICATE_SEARCH_MIN_LENGTH,
  SemanticFormRow,
  SemanticPickedObject,
  SemanticPredicateOption,
  SemanticSubject,
  SemanticSubjectGroup,
  getGroupsValue,
  getObjectIndicator,
  getObjectType,
  getPredicateOptions,
  getSubjectKey,
  toSemanticSubject,
  toSubjectRuns,
  toPredicateOption,
} from './semantic-section.utils';

export { DEFAULT_PROVIDER_ID, getObjectType } from './semantic-section.utils';
export type { SemanticFormRow, SemanticSubjectGroup } from './semantic-section.utils';

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
  /** Subject of the triple (element or hand-typed URI); absent for the annotated fragment. */
  subject?: SemanticSubject;
  /** The group subject differs from the one the stored triple was loaded with. */
  subjectChanged?: boolean;
  _raw?: any;
}[];

export type SemanticSectionOptions = {
  label: string;
};

type SearchRequest = { rowId: number; query: string };

type SubjectSearchRequest = { groupId: number; query: string };

/** First predicates, listed by every empty predicate field. */
type DefaultPredicates = {
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  options: SemanticPredicateOption[];
  /** Predicates of the ontologies used for predicates, for the footer. */
  total: number;
};

const NO_DEFAULT_PREDICATES: DefaultPredicates = { status: 'idle', options: [], total: 0 };

/** Ontologies used for predicates, as a key that changes with that selection. */
const getPredicateSelectionKey = (ontologies: { id: string; selectedCategories: string[] }[]) => ontologies
  .filter(({ selectedCategories }) => selectedCategories.includes('predicate'))
  .map(({ id }) => id)
  .sort()
  .join(',');

@Component({
    selector: 'pnd-semantic-section',
    templateUrl: './semantic-section.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, SvgIconComponent, SemanticSubjectFieldComponent]
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
    subjectLabel: _t('editmodal#semantic_subject_label'),
    subjectPlaceholder: _t('editmodal#semantic_subject_placeholder'),
    subjectHint: _t('editmodal#semantic_subject_hint'),
    subjectNoResults: _t('editmodal#semantic_subject_no_results'),
    subjectNoOntologies: _t('editmodal#semantic_subject_no_ontologies'),
    subjectAdd: _t('editmodal#semantic_subject_add'),
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

  private subjectSearch$ = new Subject<SubjectSearchRequest>();

  private nextRowId = 0;

  private nextGroupId = 0;

  private subjectEmitters = new Map<number, (type: SemanticSubjectFieldEvent, payload?: any) => void>();

  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  public rows: SemanticFormRow[] = [];

  /** Subject groups, in display order; their rows are contiguous in `rows`. */
  public groups: SemanticSubjectGroup[] = [];

  public defaultPredicates: DefaultPredicates = NO_DEFAULT_PREDICATES;

  private defaultPredicatesSub: Subscription | null = null;

  /** Template helpers. */
  public getPredicateOptions = (row: SemanticFormRow) => getPredicateOptions(row, this.defaultPredicates.options);

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
    this.listenPredicateSelection();
    this.reset$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(this.onReset);
  }

  ngOnDestroy() {
    this.clearBlurTimer();
    this.clearDefaultPredicates();
    this.destroy$.next();
  }

  init() {
    // check options label
    if (this.data.options?.label) {
      this.labels.title = this.data.options.label;
    }
    // initial value check
    const initialValue = Array.isArray(this.data.initialValue) ? this.data.initialValue : [];
    // the relations about the selection come first, as they always did
    const fragmentGroup = this.createGroup(null, true);
    const fragmentRows = initialValue.filter(({ subject }) => !subject?.uri);
    // then the other relations: consecutive triples with the same subject share a group
    const elementRows = initialValue.filter(({ subject }) => !!subject?.uri);
    const { runs, indexes } = toSubjectRuns(elementRows.map(({ subject }) => subject));
    const subjectGroups = runs.map((subject) => this.createGroup(subject, true));
    this.groups = [fragmentGroup, ...subjectGroups];

    fragmentRows.forEach(({ predicate, object, _raw }) => {
      this.addRow(predicate, object, undefined, _raw, fragmentGroup.id);
    });
    if (!fragmentRows.length) {
      this.addRow(undefined, undefined, undefined, undefined, fragmentGroup.id);
    }
    elementRows.forEach(({ predicate, object, _raw }, index) => {
      this.addRow(predicate, object, undefined, _raw, subjectGroups[indexes[index]].id);
    });
  }

  /** Group of the relations about the selection (always present, first). */
  get fragmentGroup(): SemanticSubjectGroup | undefined {
    return this.groups.find(({ subject }) => subject.isFragment);
  }

  /** Groups of the other relations, whose subject is an ontology element. */
  get subjectGroups(): SemanticSubjectGroup[] {
    return this.groups.filter(({ subject }) => !subject.isFragment);
  }

  addRow(
    predicate: SemanticItem = {} as SemanticItem,
    object: SemanticSectionValue[number]['object'] = {} as SemanticItem,
    rowIndex?: number,
    _raw?: any,
    groupId?: number,
  ) {
    const rowData = this.createRow(predicate, object, this.getTargetGroupId(rowIndex, groupId), _raw);

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
    const { groupId } = this.rows[index];
    const rows = this.rows.filter((_, rowIndex) => rowIndex !== index);
    const groupIsEmpty = !rows.some((row) => row.groupId === groupId);
    this.rows = rows;

    if (groupIsEmpty && groupId === this.fragmentGroup?.id) {
      // the only row about the selection is cleared, as before
      this.addRow(undefined, undefined, undefined, undefined, groupId);
    } else if (groupIsEmpty) {
      // the last row of an subject block takes its block away
      this.groups = this.groups.filter(({ id }) => id !== groupId);
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
    if (!query.trim()) {
      this.loadDefaultPredicates();
    }
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

  /** The only row about the selection is cleared, any other row is removed. */
  getRemoveLabel(row: SemanticFormRow) {
    const isOnlySelectionRow = row.groupId === this.fragmentGroup?.id
      && this.rows.filter(({ groupId }) => groupId === row.groupId).length === 1;
    return isOnlySelectionRow ? this.labels.clear : this.labels.remove;
  }

  /** Rows of a group, with their index in `rows` (used by the row handlers). */
  getGroupRows(group: SemanticSubjectGroup): { row: SemanticFormRow; index: number }[] {
    return this.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.groupId === group.id);
  }

  // ------------------------------------ //
  // # SUBJECT
  // ------------------------------------ //

  /**
   * Handler of the subject field of a group (one per group, kept so the field
   * input does not change at every check).
   */
  getSubjectEmit(group: SemanticSubjectGroup) {
    let emit = this.subjectEmitters.get(group.id);
    if (!emit) {
      emit = (type: SemanticSubjectFieldEvent, payload?: any) => {
        const index = this.groups.findIndex(({ id }) => id === group.id);
        if (index !== -1) this.onSubjectEvent(index, type, payload);
      };
      this.subjectEmitters.set(group.id, emit);
    }
    return emit;
  }

  private onSubjectEvent(groupIndex: number, type: SemanticSubjectFieldEvent, payload?: any) {
    switch (type) {
      case 'focus': this.onSubjectFocus(groupIndex); break;
      case 'query': this.onSubjectQueryChange(groupIndex, payload); break;
      case 'keydown': this.onSubjectKeydown(groupIndex, payload); break;
      case 'blur': this.onSubjectBlur(groupIndex); break;
      case 'toggle': this.onSubjectToggleExpand(groupIndex); break;
      case 'pick': this.onSubjectPick(groupIndex, payload); break;
      case 'pick-uri': this.onSubjectPickUri(groupIndex); break;
      default: break;
    }
    this.changeDetectorRef.markForCheck();
  }

  /** The subject field can search classes and entities. */
  canSearchSubjects(): boolean {
    return this.ontologyService.hasSelection(['class', 'entity']);
  }

  onSubjectFocus(groupIndex: number) {
    this.clearBlurTimer();
    this.setSubjectExpanded(groupIndex, true);
  }

  onSubjectToggleExpand(groupIndex: number) {
    const expand = !this.groups[groupIndex].subject.isExpanded;
    this.setSubjectExpanded(groupIndex, expand);
    if (expand) {
      this.focusSubjectInput(groupIndex);
    }
  }

  /** Typing in the subject field searches the classes and entities of the selected ontologies. */
  onSubjectQueryChange(groupIndex: number, inputValue: string) {
    const group = this.groups[groupIndex];
    const query = typeof inputValue === 'string' ? inputValue : '';
    const searchable = query.trim().length >= OBJECT_SEARCH_MIN_LENGTH && this.canSearchSubjects();
    this.replaceGroup(groupIndex, {
      ...group,
      subject: {
        ...group.subject, query, options: [], searched: false, isExpanded: true, isLoading: searchable
      }
    });
    this.subjectSearch$.next({ groupId: group.id, query: searchable ? query.trim() : '' });
  }

  /** Picks an ontology element as subject of the group: it applies to all its triples. */
  onSubjectPick(groupIndex: number, element: OntologyElement) {
    const group = this.groups[groupIndex];
    this.replaceGroup(groupIndex, {
      ...group,
      subject: {
        ...this.closedSubject(group),
        isFragment: false,
        picked: {
          uri: element.uri,
          label: element.label,
          elementType: element.category === 'class' ? 'class' : 'entity',
          ...(element.description ? { description: element.description } : {}),
        },
      }
    });
    this.blurSubjectInput(groupIndex);
    this.triggerChange();
  }

  /** Uses the typed text as subject, when it is a URI (a subject is never a literal). */
  onSubjectPickUri(groupIndex: number) {
    const group = this.groups[groupIndex];
    const uri = group.subject.query.trim();
    if (getObjectType(uri) !== 'uri') return;
    this.replaceGroup(groupIndex, {
      ...group,
      subject: {
        ...this.closedSubject(group),
        isFragment: false,
        picked: { uri, label: uri, source: 'free-text' },
      }
    });
    this.blurSubjectInput(groupIndex);
    this.triggerChange();
  }

  onSubjectKeydown(groupIndex: number, ev: KeyboardEvent) {
    const group = this.groups[groupIndex];
    if (!group?.subject.isExpanded) return;
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      this.setSubjectExpanded(groupIndex, false);
      return;
    }
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const [first] = group.subject.options;
      if (group.subject.query.trim() && first) {
        this.onSubjectPick(groupIndex, first);
      } else {
        this.onSubjectPickUri(groupIndex);
      }
    }
  }

  /**
   * Leaving the field keeps a typed URI as subject; any other text is dropped and
   * the previous subject restored (a subject is never a literal).
   */
  onSubjectBlur(groupIndex: number) {
    const { id } = this.groups[groupIndex];
    this.clearBlurTimer();
    this.blurTimer = setTimeout(() => {
      const index = this.groups.findIndex((group) => group.id === id);
      if (index === -1) return;
      if (getObjectType(this.groups[index].subject.query.trim()) === 'uri') {
        this.onSubjectPickUri(index);
      } else {
        this.setSubjectExpanded(index, false);
      }
      this.changeDetectorRef.markForCheck();
    }, BLUR_CLOSE_DELAY);
  }

  /** "Add relations about an entity or class": an subject block without subject and one empty row. */
  onAddGroupClick() {
    const group = this.createGroup(null, false, false);
    this.groups = [...this.groups, group];
    this.addRow(undefined, undefined, undefined, undefined, group.id);
    this.focusSubjectInput(this.groups.length - 1);
    this.triggerChange();
  }

  getUseAsLabel(value: string | null) {
    return _t('editmodal#semantic_default_option', { value: value || '' });
  }

  getTypeLabel(type: string) {
    return this.labels.types[type] || type;
  }

  /** The empty field is waiting for the first predicates. */
  isDefaultPredicatesLoading(row: SemanticFormRow) {
    return !row.predicate.query.trim() && this.defaultPredicates.status === 'loading';
  }

  /** Footer under the first predicates when more can be found by typing. */
  getPredicateTotalLabel(row: SemanticFormRow): string | null {
    const { status, options, total } = this.defaultPredicates;
    if (row.predicate.query.trim() || status !== 'loaded' || !options.length || total <= options.length) {
      return null;
    }
    return _t('editmodal#semantic_predicate_total', { total: String(total) });
  }

  // ------------------------------------ //
  // # PRIVATE
  // ------------------------------------ //

  // eslint-disable-next-line complexity -- Row construction covers new rows and every stored triple shape.
  private createRow(
    rawPredicate: SemanticItem | null,
    rawObject: SemanticSectionValue[number]['object'] | null,
    groupId: number,
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
      groupId,
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

    this.subjectSearch$.pipe(
      debounceTime(SEARCH_DEBOUNCE),
      switchMap(({ groupId, query }) => {
        if (!query) {
          return of({ groupId, query, results: null as OntologyElement[] | null });
        }
        return this.ontologyService.search(query, ['class', 'entity']).pipe(
          catchError(() => of([] as OntologyElement[])),
          map((results) => ({ groupId, query, results: results as OntologyElement[] | null }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(({ groupId, query, results }) => {
      const index = this.groups.findIndex((group) => group.id === groupId);
      // only the answer to the text still in the field is shown
      if (!query || index === -1 || this.groups[index].subject.query.trim() !== query) return;
      const group = this.groups[index];
      this.replaceGroup(index, {
        ...group,
        subject: {
          ...group.subject, options: results || [], searched: results !== null, isLoading: false
        }
      });
      this.changeDetectorRef.markForCheck();
    });
  }

  /** Group of a new row: the given one, the one of the row it follows, or the last one. */
  private getTargetGroupId(rowIndex?: number, groupId?: number): number {
    if (groupId !== undefined) return groupId;
    if (rowIndex !== undefined && this.rows[rowIndex]) return this.rows[rowIndex].groupId;
    return this.groups[this.groups.length - 1]?.id;
  }

  private createGroup(
    subject: SemanticSubject | null | undefined, stored: boolean, isFragment = !subject?.uri
  ): SemanticSubjectGroup {
    this.nextGroupId += 1;
    const picked = toSemanticSubject(subject);
    return {
      id: this.nextGroupId,
      subject: {
        isFragment: isFragment && !picked,
        picked,
        query: '',
        options: [],
        searched: false,
        isExpanded: false,
        isLoading: false,
      },
      ...(stored ? { storedKey: getSubjectKey(picked) } : {}),
    };
  }

  private closedSubject(group: SemanticSubjectGroup): SemanticSubjectGroup['subject'] {
    return {
      ...group.subject, query: '', options: [], searched: false, isExpanded: false, isLoading: false
    };
  }

  private replaceGroup(groupIndex: number, group: SemanticSubjectGroup) {
    this.groups = this.groups.map((currentGroup, index) => (index === groupIndex ? group : currentGroup));
  }

  private setSubjectExpanded(groupIndex: number, expand: boolean) {
    this.groups = this.groups.map((group, index) => {
      const isExpanded = index === groupIndex ? expand : false;
      if (group.subject.isExpanded === isExpanded && !group.subject.query) return group;
      return { ...group, subject: { ...this.closedSubject(group), isExpanded } };
    });
    this.changeDetectorRef.markForCheck();
  }

  private getSubjectInputEl(groupIndex: number) {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0] || {};
    return shadowRoot?.querySelector(`#subject-input-${this.groups[groupIndex]?.id}`) as HTMLInputElement | null;
  }

  private focusSubjectInput(groupIndex: number) {
    setTimeout(() => this.getSubjectInputEl(groupIndex)?.focus());
  }

  private blurSubjectInput(groupIndex: number) {
    this.getSubjectInputEl(groupIndex)?.blur();
  }

  /**
   * Request the first predicates once for all rows. A failure is kept until the
   * selection changes or the modal is reset, so a server refusing empty queries
   * is not asked again on every focus.
   */
  private loadDefaultPredicates() {
    if (this.defaultPredicates.status !== 'idle' || !this.ontologyService.hasSelection(['predicate'])) return;
    this.defaultPredicates = { ...NO_DEFAULT_PREDICATES, status: 'loading' };
    this.defaultPredicatesSub = this.ontologyService.search('', ['predicate'], PREDICATE_DEFAULT_LIMIT).pipe(
      catchError(() => of(null as OntologyElement[] | null)),
    ).subscribe((results) => {
      this.defaultPredicates = results
        ? {
          status: 'loaded',
          options: results.map(toPredicateOption),
          total: this.ontologyService.getElementCount('predicate'),
        }
        : { ...NO_DEFAULT_PREDICATES, status: 'failed' };
      this.changeDetectorRef.markForCheck();
    });
  }

  private clearDefaultPredicates() {
    this.defaultPredicatesSub?.unsubscribe();
    this.defaultPredicatesSub = null;
    this.defaultPredicates = NO_DEFAULT_PREDICATES;
  }

  /** A new selection of ontologies for predicates makes the first predicates stale. */
  private listenPredicateSelection() {
    this.ontologyService.ontologies$.pipe(
      map(getPredicateSelectionKey),
      distinctUntilChanged(),
      skip(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.clearDefaultPredicates();
      if (this.rows.some(({ predicate }) => predicate.isExpanded && !predicate.query.trim())) {
        this.loadDefaultPredicates();
      }
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
    const formValue = getGroupsValue(this.rows, this.groups);

    this.data.changed$.next({
      errors: [],
      value: formValue as unknown as SemanticSectionValue,
      id: this.id,
    });
  }

  private onReset = () => {
    this.clearDefaultPredicates();
    this.rows = [];
    this.groups = [];
    this.subjectEmitters.clear();
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
    if (expand) {
      this.loadDefaultPredicates();
    }
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
