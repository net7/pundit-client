import { Injectable } from '@angular/core';
import {
  BehaviorSubject, defer, from, Observable, of, Subject
} from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { OntologyModel } from 'src/common/models';
import {
  OntologyElement, OntologyElementCategory, OntologySelection, OntologySummary
} from 'src/communication';

export type OntologyListStatus = 'idle' | 'loaded' | 'error';

/** Delay before a selection change is saved, so rapid toggles send one request. */
export const SELECTION_SAVE_DELAY = 500;

/** Category order, as in the design (badges, selection). */
export const ONTOLOGY_CATEGORIES: OntologyElementCategory[] = ['entity', 'class', 'predicate'];

/** Source label shown for an ontology term: its prefix when present, otherwise its name. */
export const getOntologySourceLabel = (
  ontology?: { name: string; prefix?: string } | null
) => ontology?.prefix || ontology?.name || '';

/** Categories the ontology has elements of. */
export const getAvailableCategories = (ontology: OntologySummary): OntologyElementCategory[] => (
  ONTOLOGY_CATEGORIES.filter((category) => (ontology.counts?.[category] || 0) > 0)
);

const withCategories = (
  ontology: OntologySummary,
  categories: OntologyElementCategory[]
): OntologySummary => {
  const available = getAvailableCategories(ontology);
  const selectedCategories = ONTOLOGY_CATEGORIES.filter(
    (category) => categories.includes(category) && available.includes(category)
  );
  return { ...ontology, selectedCategories, selected: selectedCategories.length > 0 };
};

/** Keep only the selected categories the ontology has elements of. */
const normalize = (ontology: OntologySummary): OntologySummary => (
  withCategories(ontology, ontology.selectedCategories || [])
);

@Injectable({
  providedIn: 'root'
})
export class OntologyService {
  /** The user's ontologies, with the selection as currently shown. */
  public ontologies$ = new BehaviorSubject<OntologySummary[]>([]);

  public status$ = new BehaviorSubject<OntologyListStatus>('idle');

  /** Emits when a selection save failed and the selection was restored. */
  public saveError$ = new Subject<void>();

  /** Asks the sidebar to open the Ontologies panel (e.g. from a warning toast). */
  public openPanel$ = new Subject<void>();

  /** Ontologies whose change is waiting to be saved or being saved. */
  public savingIds$ = new BehaviorSubject<string[]>([]);

  /** Changed since the last save was sent. */
  private dirtyIds = new Set<string>();

  /** Sent with the save in progress. */
  private inFlightIds = new Set<string>();

  /** Selection confirmed by the server. */
  private saved: OntologySelection[] = [];

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  /** Chain of save requests, so saves run in order and searches can wait for them. */
  private saving: Promise<void> = Promise.resolve();

  load(): Observable<OntologySummary[]> {
    return from(OntologyModel.list()).pipe(
      map((response) => (response?.data?.data || []).map(normalize)),
      tap((ontologies) => {
        this.ontologies$.next(ontologies);
        this.saved = this.currentSelection();
        this.status$.next('loaded');
      }),
      catchError((error) => {
        console.error('[OntologyService] list failed', error);
        this.ontologies$.next([]);
        this.status$.next('error');
        return of([]);
      })
    );
  }

  /** Whether some ontology is used for at least one of the categories (any category by default). */
  hasSelection(categories: OntologyElementCategory[] = ONTOLOGY_CATEGORIES): boolean {
    return this.ontologies$.value.some(({ selectedCategories }) => (
      selectedCategories.some((category) => categories.includes(category))
    ));
  }

  /** Select an ontology with all its categories, or deselect it. */
  toggle(id: string) {
    this.update(id, (ontology) => (ontology.selected ? [] : getAvailableCategories(ontology)));
  }

  /** Use or stop using one category of an ontology. */
  toggleCategory(id: string, category: OntologyElementCategory) {
    this.update(id, ({ selectedCategories }) => (
      selectedCategories.includes(category)
        ? selectedCategories.filter((current) => current !== category)
        : [...selectedCategories, category]
    ));
  }

  /**
   * Search the elements of the selected ontologies. Waits for a pending selection
   * save, so the server already knows the selection the user sees.
   */
  search(query: string, categories: OntologyElementCategory[]): Observable<OntologyElement[]> {
    return defer(() => from(this.flush())).pipe(
      switchMap(() => {
        if (!this.hasSelection(categories)) {
          return of([]);
        }
        return from(OntologyModel.searchElements({ query, categories })).pipe(
          map((response) => response?.data?.data || [])
        );
      })
    );
  }

  clear() {
    this.clearTimer();
    this.dirtyIds.clear();
    this.inFlightIds.clear();
    this.emitSaving();
    this.saved = [];
    this.saving = Promise.resolve();
    this.ontologies$.next([]);
    this.status$.next('idle');
  }

  private update(id: string, getCategories: (ontology: OntologySummary) => OntologyElementCategory[]) {
    this.ontologies$.next(this.ontologies$.value.map((ontology) => (
      ontology.id === id ? withCategories(ontology, getCategories(ontology)) : ontology
    )));
    this.dirtyIds.add(id);
    this.emitSaving();
    this.clearTimer();
    this.saveTimer = setTimeout(() => this.flush(), SELECTION_SAVE_DELAY);
  }

  private currentSelection(): OntologySelection[] {
    return this.ontologies$.value
      .filter(({ selected }) => selected)
      .map(({ id, selectedCategories }) => ({ id, categories: selectedCategories }));
  }

  /** Send a scheduled save now; resolves when every save sent so far has completed. */
  private flush(): Promise<void> {
    if (this.saveTimer) {
      this.clearTimer();
      const ontologies = this.currentSelection();
      const sentIds = [...this.dirtyIds];
      this.dirtyIds.clear();
      this.saving = this.saving
        .then(() => {
          sentIds.forEach((id) => this.inFlightIds.add(id));
          this.emitSaving();
          return OntologyModel.saveSelection({ ontologies });
        })
        .then((response) => {
          this.saved = response?.data?.data?.ontologies || ontologies;
          // show what the server kept, unless the user already changed it again
          if (!this.saveTimer) {
            this.applySelection(this.saved);
          }
        })
        .catch((error) => {
          console.error('[OntologyService] save selection failed', error);
          this.applySelection(this.saved);
          this.saveError$.next();
        })
        .finally(() => {
          sentIds.forEach((id) => this.inFlightIds.delete(id));
          this.emitSaving();
        });
    }
    return this.saving;
  }

  private applySelection(selection: OntologySelection[]) {
    this.ontologies$.next(this.ontologies$.value.map((ontology) => withCategories(
      ontology,
      selection.find(({ id }) => id === ontology.id)?.categories || []
    )));
  }

  private emitSaving() {
    this.savingIds$.next([...new Set([...this.dirtyIds, ...this.inFlightIds])]);
  }

  private clearTimer() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }
}
