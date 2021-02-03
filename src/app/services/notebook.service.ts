import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Notebook, SharingModeType } from '@pundit/communication';
import { environment as env } from '../../environments/environment';

export type NotebookData = {
  id: string;
  label: string;
  sharingMode: string;
}

export type NotebookUpdate = {
  label?: string;
  sharingMode?: SharingModeType;
}

const SELECTED_NOTEBOOK_KEY = 'pundit-notebook';

@Injectable()
export class NotebookService {
  private notebooks: NotebookData[] = [];

  private selectedId: string;

  public selectedChanged$: Subject<void> = new Subject();

  constructor() {
    if (!env.chromeExt) {
      this.setSelectedFromMemory();
    }
  }

  public getSelected = () => this.getNotebookById(this.selectedId);

  public setSelected(id: string) {
    this.selectedId = id;

    // emit signal
    this.selectedChanged$.next();

    if (!env.chromeExt) {
      this.saveSelectedInMemory(this.selectedId);
    }
  }

  /**
   * Update the cached notebook data.
   *
   * Use src\app\models\notebook\update
   * to update the online version instead.
  */
  update(notebookID, data: NotebookUpdate) {
    const { label, sharingMode } = data;
    if (!this.getNotebookById(notebookID)) return;
    const notebook = this.getNotebookById(notebookID);
    if (label) notebook.label = label;
    if (sharingMode) notebook.sharingMode = sharingMode;
  }

  load(rawNotebooks: Notebook[]) {
    rawNotebooks.forEach((rawNotebook) => {
      this.add(rawNotebook);
    });
  }

  add(rawNotebook: Notebook) {
    if (!this.getNotebookById(rawNotebook.id)) {
      const { id, label, sharingMode } = rawNotebook;
      this.notebooks.push({ id, label, sharingMode });
    }
  }

  getNotebookById(notebookId: string): NotebookData | null {
    return this.notebooks.find(({ id }) => id === notebookId) || null;
  }

  getAll = (): NotebookData[] => this.notebooks;

  clear() {
    this.notebooks = [];

    if (!env.chromeExt) {
      this.removeSelectedFromMemory();
    }
  }

  private setSelectedFromMemory() {
    const selected = localStorage.getItem(SELECTED_NOTEBOOK_KEY);
    if (selected) {
      this.selectedId = selected;
    }
  }

  private saveSelectedInMemory(selectedId) {
    localStorage.setItem(SELECTED_NOTEBOOK_KEY, selectedId);
  }

  private removeSelectedFromMemory() {
    localStorage.removeItem(SELECTED_NOTEBOOK_KEY);
  }
}
