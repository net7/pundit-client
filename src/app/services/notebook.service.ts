import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Notebook, SharingModeType } from '@pundit/communication';
import { StorageSyncKey, StorageSyncService } from './storage-sync.service';

export type NotebookData = {
  id: string;
  label: string;
  sharingMode: string;
  userId: string;
}

export type NotebookUpdate = {
  label?: string;
  sharingMode?: SharingModeType;
}

@Injectable()
export class NotebookService {
  private notebooks: NotebookData[] = [];

  private selectedId: string;

  public selectedChanged$: Subject<void> = new Subject();

  constructor(
    private storage: StorageSyncService
  ) {
    // check storage sync
    const selected = this.storage.get(StorageSyncKey.Notebook);
    if (selected) {
      this.selectedId = selected;
    }
  }

  public getSelected = () => this.getNotebookById(this.selectedId);

  public setSelected(id: string) {
    this.selectedId = id;

    // storage sync
    this.storage.set(StorageSyncKey.Notebook, id);

    // emit signal
    this.selectedChanged$.next();
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

  /**
   * Transforms a notebook object and
   * adds it to the cache.
   * @param rawNotebook a notebook object
   */
  add(rawNotebook: Notebook) {
    if (!this.getNotebookById(rawNotebook.id)) {
      const {
        id, label, sharingMode, userId
      } = rawNotebook;
      this.notebooks.push({
        id, label, sharingMode, userId
      });
    }
  }

  create = this.add;

  getNotebookById(notebookId: string): NotebookData | null {
    return this.notebooks.find(({ id }) => id === notebookId) || null;
  }

  getByUserId(id: string): NotebookData[] {
    return this.notebooks.filter(({ userId }) => userId === id);
  }

  getAll = (): NotebookData[] => this.notebooks;

  clear() {
    this.notebooks = [];

    // storage sync
    this.storage.remove(StorageSyncKey.Notebook);
  }
}
