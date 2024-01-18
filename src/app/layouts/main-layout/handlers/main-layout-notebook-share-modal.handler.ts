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
        const newUsers = this.layoutDS.usersList.filter((item) => item.email !== payload.email);
        this.layoutDS.notebookService.sharedWithChanged$.next({
          users: newUsers,
          openModal: false
        });
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
        setTimeout(() => {
          notebookService.getListOfUsers(true);
        }, 500);
      }
    });
  }

  private openShareModal() {
    const { notebookService } = this.layoutDS;
    const notebook = notebookService.getSelected();
    notebook.users = this.layoutDS.usersList;
    this.layoutDS.one('notebook-share-modal').update(notebook);
  }
}
