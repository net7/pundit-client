import { Injectable } from '@angular/core';
import {
  from, Subject, EMPTY
} from 'rxjs';
import { Notebook, NotebookPermissions, SharingModeType } from '@pundit/communication';
import { catchError, tap } from 'rxjs/operators';
import { NotebookModel } from '../../common/models';
import { UserService } from './user.service';

export enum NotebookUserRole {
  Owner = 'owner',
  Editor = 'editor'
}

export enum NotebookUserStatus {
  Pending = 'pending',
  Removed = 'removed',
  Joined = 'joined',
}

export type NotebookUser = {
  id: string;
  username: string;
  thumb: string;
  role: NotebookUserRole;
  status: NotebookUserStatus;
}

export type NotebookData = {
  id: string;
  label: string;
  sharingMode: string;
  userId: string;
  users?: NotebookUser[];
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
    private userService: UserService
  ) {}

  public getSelected = () => this.getNotebookById(this.selectedId);

  public setSelected(id: string, sync = false) {
    if (!id || id === this.selectedId) return;
    const previousId = this.selectedId;
    this.selectedId = id;
    if (sync) {
      from(NotebookModel.setDefault(id)).pipe(
        catchError((err) => {
          console.warn('NotebookService setDefault error:', err);
          // restore previous
          this.setSelected(previousId);
          return EMPTY;
        })
      );
    }
  }

  /**
   * Updates notebook & notebook data.
   */
  update(notebookID, data: NotebookUpdate) {
    const userId = this.userService.whoami().id;
    const nb = this.getNotebookById(notebookID);
    return from(NotebookModel.update(notebookID, {
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

  create(label: string) {
    const userId = this.userService.whoami().id;
    const sharingMode = 'public';
    return from(NotebookModel.create({
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
          changed: new Date().toLocaleDateString(),
          created: new Date().toLocaleDateString(),
        };
        this.add(rawNotebook);
        // set the new notebook as the default
        this.setSelected(data.id, true);
      })
    );
  }

  search() {
    return from(NotebookModel.search()).pipe(
      tap(({ data: notebooksData }) => {
        const { notebooks } = notebooksData;
        this.load(notebooks);
      })
    );
  }

  userSearch = (query: string) => from(NotebookModel.userSearch(query));

  // LUCA P.
  userInviteWithEmail(id: string, data: NotebookPermissions) {
    return from(NotebookModel.userInviteWithEmail(id, data));
  }

  // TOGLI
  getProva(id: string) {
    return from(NotebookModel.getProva(id));
  }
  //-----

  userInviteWithId = (id: string) => from(NotebookModel.userInviteWithId(id));

  userRemove = (id: string) => from(NotebookModel.userRemove(id));

  getNotebookById(notebookId: string): NotebookData | null {
    return this.notebooks.find(({ id }) => id === notebookId) || null;
  }

  getByUserId(id: string): NotebookData[] {
    return this.notebooks.filter(({ userId }) => userId === id);
  }

  getAll = (): NotebookData[] => this.notebooks;

  clear() {
    this.notebooks = [];
    this.selectedId = null;
  }
}
