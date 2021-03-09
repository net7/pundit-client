import { takeUntil } from 'rxjs/operators';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

const SIDEBAR_EXPANDED_CLASS = 'pnd-annotation-sidebar-expanded';

export class MainLayoutAppEventsHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  public listen() {
    this.layoutEH.appEvent$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case AppEvent.KeyUpEscape:
          this.onKeyupEscape();
          this.layoutEH.emitOuter(getEventType(MainLayoutEvent.KeyUpEscape));
          break;
        case AppEvent.AnnotationDeleteClick:
          this.onAnnotationDeleteClick(payload);
          this.layoutEH.emitOuter(getEventType(MainLayoutEvent.AnnotationDeleteClick));
          break;
        case AppEvent.AnnotationMouseEnter:
          this.onAnnotationMouseEnter(payload);
          break;
        case AppEvent.AnnotationMouseLeave:
          this.onAnnotationMouseLeave(payload);
          break;
        case AppEvent.AnnotationEditComment:
          this.onAnnotationEditComment(payload);
          break;
        case AppEvent.SidebarCollapse:
          this.onSidebarCollapse(payload);
          break;
        case AppEvent.Logout:
          this.onLogout();
          this.layoutEH.appEvent$.next({
            type: AppEvent.Clear
          });
          this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
          break;
        default:
          break;
      }
    });
  }

  private onKeyupEscape() {
    if (tooltipModel.isOpen()) {
      selectionModel.clearSelection();
      tooltipModel.hide();
    }
  }

  private onAnnotationDeleteClick(payload) {
    this.layoutDS.state.annotation.deleteId = payload;
  }

  private onAnnotationMouseEnter({ id }) {
    this.layoutDS.anchorService.addHoverClass(id);
  }

  private onAnnotationMouseLeave({ id }) {
    this.layoutDS.anchorService.removeHoverClass(id);
  }

  private onAnnotationEditComment(payload) {
    const { ds } = this.layoutDS.annotationService.getAnnotationById(payload);
    const {
      _meta, comment, _raw, body
    } = ds.output;
    const notebookData = this.layoutDS.notebookService.getNotebookById(_meta.notebookId);
    this.layoutDS.state.comment = {
      comment: comment || null,
      notebookId: null,
      isUpdate: true,
    };
    this.layoutDS.state.annotation.updatePayload = _raw;
    this.layoutDS.openCommentModal({
      notebookData,
      comment,
      textQuote: body,
    });
  }

  private onSidebarCollapse({ isCollapsed }) {
    if (isCollapsed) {
      document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
    } else {
      document.body.classList.add(SIDEBAR_EXPANDED_CLASS);
    }
  }

  private onLogout() {
    // reset
    this.layoutDS.tokenService.clear();
    this.layoutDS.userService.clear();
    this.layoutDS.notebookService.clear();
    this.layoutDS.annotationService.clear();
    this.layoutDS.anchorService.clear();
    this.layoutDS.userService.logout();

    // emit signals
    this.layoutDS.annotationService.totalChanged$.next(0);
    this.layoutDS.hasLoaded$.next(true);
  }
}
