import { takeUntil } from 'rxjs/operators';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { EditModalParams, LayoutHandler, SemanticItem } from 'src/app/types';
import { _t } from '@n7-frontend/core';
import { SemanticTripleType } from '@pundit/communication';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export const SIDEBAR_EXPANDED_CLASS = 'pnd-annotation-sidebar-expanded';

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
          this.onAnnotationEdit(payload, 'comment');
          break;
        case AppEvent.AnnotationEditTags:
          this.onAnnotationEdit(payload, 'tags');
          break;
        case AppEvent.AnnotationEditSemantic:
          this.onAnnotationEdit(payload, 'semantic');
          break;
        case AppEvent.AnnotationEditFullPage:
          this.onAnnotationEdit(payload, 'fullpage');
          break;
        case AppEvent.AnnotationNewFullPage:
          this.onFullPageAnnotationCreate();
          break;
        case AppEvent.SidebarCollapse:
          this.onSidebarCollapse(payload);
          break;
        case AppEvent.SidebarLogoutClick:
          this.layoutEH.appEvent$.next({
            type: AppEvent.Logout,
            payload: {
              callback: () => {
                // emit signal
                this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
              }
            }
          });
          break;
        case AppEvent.Logout:
          this.onLogout(payload);
          this.layoutEH.appEvent$.next({
            type: AppEvent.Clear
          });
          break;
        case AppEvent.Refresh:
          this.onRefresh();
          break;
        case AppEvent.ClearAnonymousSelectionRange:
          this.layoutDS.state.anonymousSelectionRange = null;
          break;
        default:
          break;
      }

      this.layoutEH.detectChanges();
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

  private onAnnotationEdit(payload, mode: 'comment'| 'tags' | 'semantic' | 'fullpage') {
    const { data$ } = this.layoutDS.annotationService.getAnnotationById(payload);
    const annotation = data$.getValue();
    this.layoutDS.removePendingAnnotation();
    this.layoutDS.state.annotation.updatePayload = annotation;

    const params = {
      sections: [{
        id: 'tags',
        value: annotation.tags
      }, {
        id: 'notebook',
        value: annotation.notebookId
      }],
      textQuote: annotation.subject?.selected?.text,
      validation: {
        required: {
          condition: mode === 'fullpage' ? 'OR' : 'AND'
        }
      }
    } as EditModalParams;

    if (mode === 'comment') {
      params.sections.push({
        id: 'comment',
        value: annotation.type === 'Commenting' ? annotation.content?.comment : undefined,
        focus: true
      });
    } else if (mode === 'semantic') {
      params.sections.push({
        id: 'semantic',
        value: annotation.type === 'Linking' ? this.getSemanticData(annotation.content) : undefined,
        focus: true
      });
      params.saveButtonLabel = _t('editmodal#save_semantic');
    } else if (mode === 'fullpage') {
      params.sections[0].required = true;
      params.sections.push({
        id: 'comment',
        value: annotation.type === 'Commenting' ? annotation.content?.comment : undefined,
        focus: true,
        required: true
      });
    } else {
      // focus on input tags
      params.sections[0].focus = true;
      params.saveButtonLabel = _t('editmodal#save_tags');
    }
    this.layoutDS.openEditModal(params);
  }

  private getSemanticData(rawSemantic: SemanticTripleType[]): {
    predicate: SemanticItem;
    object: SemanticItem;
  }[] {
    return rawSemantic.length ? rawSemantic.map((triple) => {
      const { predicate } = triple;
      let object = null;
      // literal
      if ('text' in triple.object) {
        object = {
          label: triple.object.text,
          uri: null
        };
        // uri as free-text
      } else if ('uri' in triple.object && triple.object.source === 'free-text') {
        object = {
          label: triple.object.uri,
          uri: triple.object.uri,
        };
        // uri
      } else if ('uri' in triple.object && triple.object.source === 'search') {
        object = {
          label: triple.object.label,
          uri: triple.object.uri,
        };
        // web page
      } else if ('pageTitle' in triple.object) {
        object = {
          label: triple.object.pageTitle,
          uri: null
        };
      } else {
        console.warn('No handler for semantic object', triple.object);
      }
      return { predicate, object };
    }) : undefined;
  }

  private onSidebarCollapse({ isCollapsed }) {
    if (isCollapsed) {
      document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
    } else {
      document.body.classList.add(SIDEBAR_EXPANDED_CLASS);
    }
  }

  private onLogout(payload) {
    this.resetAppData(payload);
    if (!payload?.skipRequest) {
      this.layoutDS.punditLoginService.logout().catch((error) => {
        console.warn(error);
      });
    }
  }

  private resetAppData = (payload) => {
    this.layoutDS.userService.clear();
    this.layoutDS.notebookService.clear();
    this.layoutDS.tagService.clear();
    this.layoutDS.semanticPredicateService.clear();
    this.layoutDS.userService.logout();

    // close verify toast
    this.layoutDS.closeEmailVerifiedToast();

    // emit signals
    this.layoutDS.annotationService.totalChanged$.next(0);
    this.layoutDS.hasLoaded$.next(true);

    // callback check
    if (payload?.callback) {
      payload.callback();
    }
  }

  private onRefresh() {
    // reset
    this.layoutDS.annotationService.clear();
    this.layoutDS.anchorService.clear();

    // emit clear signal
    this.layoutEH.appEvent$.next({ type: AppEvent.Clear });

    // refresh data
    if (this.layoutDS.userService.whoami()) {
      this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetUserData));
    } else {
      this.layoutEH.emitInner(getEventType(MainLayoutEvent.GetPublicData));
    }
    this.layoutDS.hasLoaded$.next(true);
  }

  private onFullPageAnnotationCreate = () => {
    const pendingAnnotation = this.layoutDS.addPendingAnnotation();
    this.layoutDS.removePendingAnnotation();
    this.layoutDS.anchorService.add(pendingAnnotation);

    this.layoutDS.openEditModal({
      textQuote: pendingAnnotation.subject.pageTitle || pendingAnnotation.subject.pageContext,
      validation: {
        required: {
          condition: 'OR'
        }
      },
      sections: [{
        id: 'comment',
        required: true,
        focus: true
      }, {
        id: 'tags',
        required: true,
      }, {
        id: 'notebook'
      }]
    });
  }
}
