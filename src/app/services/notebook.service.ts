import { Injectable } from '@angular/core';
import { from, Subject } from 'rxjs';
import { Notebook, SharingModeType } from '@pundit/communication';
import * as notebookModel from 'src/app/models/notebook';
import { tap } from 'rxjs/operators';
import { StorageSyncKey, StorageSyncService } from './storage-sync.service';
import { UserService } from './user.service';

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
    private userService: UserService,
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
   * Updates notebook & notebook data.
   */
  update(notebookID, data: NotebookUpdate) {
    const userId = this.userService.whoami().id;
    const nb = this.getNotebookById(notebookID);
    return from(notebookModel.update(notebookID, {
      data: {
        userId,
        label: data.label ? data.label : nb.label,
        sharingMode: data.sharingMode ? data.sharingMode : (nb.sharingMode as SharingModeType),
        userWithReadAccess: [],
        userWithWriteAccess: [],
      }
    })).pipe(
      tap(() => {
        const { label, sharingMode } = data;
        if (label) nb.label = label;
        if (sharingMode) nb.sharingMode = sharingMode;
      })
    );
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

  create(label) {
    const userId = this.userService.whoami().id;
    const sharingMode = 'public';
    return from(notebookModel.create({
      data: {
        label,
        userId,
        sharingMode,
      }
    })).pipe(
      tap(({ data }) => {
        const rawNotebook: Notebook = {
          label,
          userId,
          sharingMode,
          id: data.id,
          changed: new Date(),
          created: new Date(),
        };
        this.add(rawNotebook);
      })
    );
  }

  search() {
    return from(notebookModel.search()).pipe(
      tap(({ data: notebooksData }) => {
        const { notebooks } = notebooksData;
        this.load(notebooks);
        if (!this.getSelected()) {
          // first notebook as default
          const { id } = notebooks[0];
          this.setSelected(id);
        }
      })
    );
  }

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
