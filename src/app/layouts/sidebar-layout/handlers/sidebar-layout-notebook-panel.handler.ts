import { _t } from '@net7/core';
import {
  AppEvent, getEventType, NotebookPanelEvent, SidebarLayoutEvent
} from 'src/app/event-types';
import { NotebookUpdate } from 'src/app/services/notebook.service';
import { LayoutHandler } from 'src/app/types';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { NotebookPermissions } from '@pundit/communication';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';

export class SidebarLayoutNotebookPanelHandler implements LayoutHandler {
  constructor(
    private layoutDS: SidebarLayoutDS,
    private layoutEH: SidebarLayoutEH
  ) {}

  public listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case NotebookPanelEvent.ChangeSelected: // change the default notebook
          this.layoutEH.notebookService.setSelected(payload, true);
          this.layoutDS.updateNotebookPanel();
          // toast
          this.layoutEH.toastService.success({
            title: _t('toast#notebookchangecurrent_success_title'),
            text: _t('toast#notebookchangecurrent_success_text'),
          });
          // analytics
          AnalyticsModel.track({
            action: AnalyticsAction.NotebookCurrentChanged,
            payload: {
              location: 'panel'
            }
          });
          break;

        case NotebookPanelEvent.EditSharingMode: { // change sharing mode for the notebook
          const { id, type: newSharingMode } = payload;
          this.handleNotebookUpdate(id, { sharingMode: newSharingMode });
        } break;

        case NotebookPanelEvent.CreateNotebook:
          // creates notebook
          this.layoutEH.notebookService.create(payload).pipe(
            catchError((err) => {
              console.error(err);
              // toast
              this.layoutEH.toastService.error({
                title: _t('toast#notebookchangecurrent_error_title'),
                text: _t('toast#notebookchangecurrent_error_text'),
              });
              return EMPTY;
            })
          ).subscribe(({ data }) => {
            this.layoutEH.notebookService.setSelected(data.id, true); // select the new notebook
            this.layoutDS.updateNotebookPanel();
            this.layoutEH.notebookService.getListOfUsers();

            // signal
            this.layoutEH.emitOuter(
              getEventType(SidebarLayoutEvent.NotebookPanelNewNotebookCreated)
            );

            // toast
            this.layoutEH.toastService.success({
              title: _t('toast#notebookchangecurrent_success_title'),
              text: _t('toast#notebookchangecurrent_success_text'),
            });

            // analytics
            AnalyticsModel.track({
              action: AnalyticsAction.NotebookCreated,
              payload: {
                location: 'panel'
              }
            });
          });
          break;

        case NotebookPanelEvent.OpenShareModal:
          this.layoutEH.appEvent$.next({
            type: AppEvent.NotebookOpenShareModal,
          });
          break;

        case NotebookPanelEvent.ActionClick:
          this.onActionClick(payload);
          break;

        default:
          break;
      }
    });
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
    const { notebookService } = this.layoutEH;
    const notebook = notebookService.getSelected();
    const body = {
      email: payload.email
    };
    return notebookService.userRemoveWithEmail(notebook.id, body).subscribe((response) => {
      if (response.status === 200) {
        const newUsers = this.layoutDS.usersList.filter((item) => item.email !== payload.email);
        this.layoutEH.notebookService.sharedWithChanged$.next({
          users: newUsers,
          openModal: false
        });
      }
    });
  }

  private onResend(payload) {
    const { notebookService } = this.layoutEH;
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

  /**
   * Request an update of the notebook on the back-end.
   *
   * @param notebookId notebook id
   * @param updateData modifications to the original notebook
   */
  private handleNotebookUpdate(notebookId: string, updateData: NotebookUpdate) {
    // update the backend version of the notebook
    this.layoutEH.notebookService.update(notebookId, updateData).pipe(
      catchError((err) => {
        console.warn('Notebook update error:', err);
        // toast
        this.layoutEH.toastService.error({
          title: _t('toast#notebookedit_error_title'),
          text: _t('toast#notebookedit_error_text'),
        });
        return EMPTY;
      })
    ).subscribe(() => {
      // signal
      this.layoutEH.emitOuter(getEventType(SidebarLayoutEvent.NotebookSharingModeUpdated));

      // toast
      this.layoutEH.toastService.success({
        title: _t('toast#notebookedit_success_title'),
        text: _t('toast#notebookedit_success_text'),
      });

      // analytics
      AnalyticsModel.track({
        action: AnalyticsAction.NotebookVisibilityChanged,
        payload: {
          visibility: updateData.sharingMode
        }
      });
    });
  }
}
