// import { sample } from 'lodash';
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
// import { NotebookUserRole, NotebookUserStatus } from 'src/app/services/notebook.service';
import { NotebookPermissions } from '@pundit/communication';
import { NotebookShareModalDS } from 'src/app/data-sources';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

// const autocompleteMock = () => Array(Math.round(Math.random() * 10)).fill(null).map((_, i) => ({
//   username: `User ${i}`,
//   email: `email-${i}@example.com`,
//   thumb: `https://i.pravatar.cc/50?img${i}`
// }));

// const userRoles = [NotebookUserRole.Owner, NotebookUserRole.Editor];

// const userStatus = [
//   NotebookUserStatus.Joined,
//   NotebookUserStatus.Pending,
//   NotebookUserStatus.Removed,
// ];

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
        case NotebookShareModalEvent.Ok:
          this.onOk(payload);
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

  private onActionClick = ({ id, action }) => {
    const { notebookService } = this.layoutDS;
    let request$;

    switch (action) {
      case 'remove':
      case 'delete_invite':
        request$ = notebookService.userRemove(id);
        break;
      case 'resend_invite':
        request$ = notebookService.userInviteWithId(id);
        break;
      default:
        break;
    }

    return request$.subscribe((actionResponse) => {
      console.warn('FIXME: gestire risposta dell\'azione', id, action, actionResponse);
    });
  }

  private onOk(invitationsList) {
    const { notebookService } = this.layoutDS;
    const currentNotebookId = notebookService.getSelected()?.id;
    const body: NotebookPermissions = {
      userWithReadAccess: [],
      userWithWriteAccess: []
    };
    invitationsList.forEach((value) => {
      const { email } = value;
      const { action } = value;
      body.userWithReadAccess.push(email);
      if (action === 'write') {
        body.userWithWriteAccess.push(email);
      }
    });
    return notebookService.userInviteWithEmail(currentNotebookId, body).subscribe((response) => {
      console.warn(response);
    });
  }

  private openShareModal() {
    const { notebookService } = this.layoutDS;
    // const { userService } = this.layoutDS;
    const notebook = notebookService.getSelected();
    // const ownerId = userService.whoami().id;
    return notebookService.search().subscribe((response) => {
      console.warn('search()', response);
      console.warn('getSelected()', notebook);
    });
    // return notebookService.search().subscribe((response) => {
    //   const pendingLists = {
    //     pendingRead: [],
    //     pendingWrite: []
    //   };
    //   response.data.notebooks.forEach((item) => {
    //     if (item.id === notebook.id) {
    //       const notebookInUse = Object.assign(item);
    //       pendingLists.pendingRead = notebookInUse.userWithPendingReadingRequest;
    //       pendingLists.pendingWrite = notebookInUse.userWithPendingWritingRequest;
    //     }
    //   });
    //   let joinedUsers = response.data.users.map(({ id, username, thumb }) => ({
    //     id,
    //     username,
    //     thumb,
    //     role: (id === ownerId) ? NotebookUserRole.Owner : NotebookUserRole.Editor,
    //     status: NotebookUserStatus.Joined
    //   }));
    //   const ownerItem = joinedUsers.filter((item) => item.id === ownerId);
    //   joinedUsers = joinedUsers.filter((item) => item.id !== ownerId);
    //   joinedUsers.unshift(ownerItem[0]);
    //   console.warn('JOINED', joinedUsers);
    //   console.warn('PENDING', pendingLists);
    //   this.layoutDS.one('notebook-share-modal').update(notebook);
    // });
    // FIXME: togliere
    // notebook.users = autocompleteMock().map(({ username, thumb }, index) => ({
    //   username,
    //   thumb,
    //   id: `user-${index}`,
    //   role: sample(userRoles),
    //   status: sample(userStatus),
    // }));
    // this.layoutDS.one('notebook-share-modal').update(notebook);
  }
}
