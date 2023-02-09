import { sample } from 'lodash';
import {
  Observable, of, Subject
} from 'rxjs';
import {
  debounceTime, delay, distinctUntilChanged, first, switchMap
} from 'rxjs/operators';
import { getEventType, MainLayoutEvent, NotebookShareModalEvent } from 'src/app/event-types';
import { NotebookUserRole, NotebookUserStatus } from 'src/app/services/notebook.service';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

const autocompleteMock = () => Array(Math.round(Math.random() * 10)).fill(null).map((_, i) => ({
  username: `User ${i}`,
  email: `email-${i}@example.com`,
  thumb: `https://i.pravatar.cc/50?img${i}`
}));

const userRoles = [NotebookUserRole.Owner, NotebookUserRole.Editor];

const userStatus = [
  NotebookUserStatus.Joined,
  NotebookUserStatus.Pending,
  NotebookUserStatus.Removed,
];

export class MainLayoutNotebookShareModalHandler implements LayoutHandler {
  private autocomplete$: Subject<string> = new Subject();

  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    // FIXME: togliere
    this.layoutDS.userService.logged$.pipe(
      delay(10000),
      first(),
    ).subscribe(() => {
      const notebook = this.layoutDS.notebookService.getSelected();
      // FIXME: togliere
      notebook.users = autocompleteMock().map(({ username, thumb }, index) => ({
        username,
        thumb,
        id: `user-${index}`,
        role: sample(userRoles),
        status: sample(userStatus),
      }));
      this.layoutDS.one('notebook-share-modal').update(notebook);
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
      switchMap(this.doAutocompleteRequest$),
    ).subscribe((response) => {
      this.layoutEH.emitOuter(
        getEventType(MainLayoutEvent.NotebookShareAutocompleteResponse),
        response
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
}
