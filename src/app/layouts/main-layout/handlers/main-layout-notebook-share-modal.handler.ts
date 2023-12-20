import {
  forkJoin,
  Observable, of, Subject
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import {
  AppEvent, getEventType, MainLayoutEvent, NotebookShareModalEvent
} from 'src/app/event-types';
import { NotebookUserRole, NotebookUserStatus } from 'src/app/services/notebook.service';
import { NotebookPermissions } from '@pundit/communication';
import { NotebookShareModalDS } from 'src/app/data-sources';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutNotebookShareModalHandler implements LayoutHandler {
  private autocomplete$: Subject<string> = new Subject();

  notebookShareModalDS: NotebookShareModalDS;

  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    this.layoutEH.appEvent$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(({ type }) => {
      switch (type) {
        case AppEvent.NotebookOpenShareModal:
          this.openShareModal();
          break;
        default:
          break;
      }
    });

    // listen for modal events
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookShareModalEvent.Input:
          this.autocomplete$.next(payload);
          break;
        case NotebookShareModalEvent.ActionClick:
          this.onActionClick(payload);
          break;
        case NotebookShareModalEvent.Confirm:
          this.onConfirm(payload);
          break;
        default:
          break;
      }
    });

    this.listenAutocomplete();
  }

  private listenAutocomplete() {
    this.autocomplete$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => forkJoin({
        query: of(query),
        response: this.doAutocompleteRequest$(query)
      })),
    ).subscribe((data) => {
      this.layoutEH.emitOuter(
        getEventType(MainLayoutEvent.NotebookShareAutocompleteResponse),
        data
      );
    });
  }

  private doAutocompleteRequest$ = (value): Observable<any> => {
    const query = value?.length ? value.trim() : value;
    if (query?.length < 3) return of(null);
    return this.layoutDS.notebookService.userSearch(query);
  }

  private onActionClick = (payload) => {
    switch (payload.action) {
      case 'remove':
      case 'delete_invite':
        this.onDelete(payload);
        break;
      case 'resend_invite':
        this.onResend(payload);
        break;
      default:
        break;
    }
  }

  private onDelete(payload) {
    const { notebookService } = this.layoutDS;
    const notebook = notebookService.getSelected();
    const body = {
      email: payload.email
    };
    return notebookService.userRemoveWithEmail(notebook.id, body).subscribe((response) => {
      if (response.status === 200) {
        notebook.users = notebook.users.filter((item) => item.email !== payload.email);
        this.layoutDS.one('notebook-share-modal').update(notebook);
      }
    });
  }

  private onResend(payload) {
    const { notebookService } = this.layoutDS;
    const currentNotebookId = notebookService.getSelected()?.id;
    const body: NotebookPermissions = {
      userWithReadAccess: [],
      userWithWriteAccess: []
    };
    body.userWithReadAccess.push(payload.email);
    if (payload.permission === 'write') {
      body.userWithWriteAccess.push(payload.email);
    }
    return notebookService.userInviteWithEmail(currentNotebookId, body).subscribe((response) => {
      if (response.status === 200) {
        //
      }
    });
  }

  private onConfirm(payload) {
    const { notebookService } = this.layoutDS;
    const notebook = notebookService.getSelected();
    const body: NotebookPermissions = {
      userWithReadAccess: [],
      userWithWriteAccess: []
    };
    body.userWithReadAccess.push(payload.email);
    if (payload.action === 'write') {
      body.userWithWriteAccess.push(payload.email);
    }
    return notebookService.userInviteWithEmail(notebook.id, body).subscribe((response) => {
      if (response.status === 200) {
        const user = this.createSingleUser(payload);
        notebook.users.push(user);
        this.layoutDS.one('notebook-share-modal').update(notebook);
      }
    });
  }

  private openShareModal() {
    const { notebookService } = this.layoutDS;
    const notebook = notebookService.getSelected();
    return notebookService.search().subscribe((response) => {
      const selected = Object.assign(response.data.notebooks
        .find((item) => item.id === notebook.id));
      const { users } = response.data;
      const readAccess = selected.userWithReadAccess
        .filter((item) => !selected.userWithWriteAccess.includes(item));
      const readPending = selected.userWithPendingReadingRequest
        .filter((item) => !selected.userWithPendingWritingRequest.includes(item));
      const userList = {
        owner: this.createOwner(users, notebook.userId),
        read: this.createUsers(readAccess, users, false, false),
        write: this.createUsers(selected.userWithWriteAccess, users, false, true),
        pendingRead: this.createUsers(readPending, users, true, false),
        pendingWrite: this.createUsers(selected.userWithPendingWritingRequest, users, true, true)
      };
      const userArray = userList.owner.concat(userList.read, userList.write,
        userList.pendingRead, userList.pendingWrite);
      notebook.users = userArray;
      this.layoutDS.one('notebook-share-modal').update(notebook);
    });
  }

  private createOwner(users, ownerId) {
    const owner = users.filter((item) => item.id === ownerId);
    const ownerItem = owner.map(({
      id, username, thumb, emailAddress
    }) => ({
      id,
      username,
      email: emailAddress,
      thumb,
      role: NotebookUserRole.Owner,
      status: NotebookUserStatus.Joined,
      action: ''
    }));
    return ownerItem;
  }

  private createUsers(array, users, isPending, canWrite) {
    const list = (isPending) ? array
      : users.filter((item) => array.find((element) => element === item.id));
    const userList = list.map((item) => ({
      id: (isPending) ? '' : item.id,
      username: (isPending) ? item : item.username,
      email: (isPending) ? item : item.emailAddress,
      thumb: (isPending) ? '' : item.thumb,
      role: NotebookUserRole.Editor,
      status: (isPending) ? NotebookUserStatus.Pending : NotebookUserStatus.Joined,
      action: (canWrite) ? 'write' : 'read'
    }));
    return userList;
  }

  private createSingleUser(selected) {
    const user = {
      id: '',
      username: selected.email,
      email: selected.email,
      thumb: selected.thumb,
      role: NotebookUserRole.Editor,
      status: NotebookUserStatus.Pending,
      action: selected.action,
      actionAsLabel: selected.action
    };
    return user;
  }
}
