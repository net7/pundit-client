import { takeUntil } from 'rxjs/operators';
import { selectionModel } from 'src/app/models/selection/selection-model';
import { tooltipModel } from 'src/app/models/tooltip-model';
import { AppEvent, getEventType, MainLayoutEvent } from 'src/app/event-types';
import { EditModalParams, LayoutHandler, SemanticItem } from 'src/app/types';
import { _t } from '@n7-frontend/core';
import { Annotation, SemanticTripleType } from '@pundit/communication';
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
        case AppEvent.AnnotationNewFullPage:
          this.onFullPageAnnotationCreate(payload);
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

  private onAnnotationEdit(payload, mode: 'comment'| 'tags' | 'semantic') {
    const { data$ } = this.layoutDS.annotationService.getAnnotationById(payload);
    const annotation = data$.getValue();
    this.layoutDS.removePendingAnnotation();
    this.layoutDS.state.annotation.updatePayload = annotation;
    const isFullPage = !annotation.subject?.selected;
    const params = {
      sections: [{
        id: 'tags',
        value: annotation.tags,
        required: isFullPage,
      }, {
        id: 'notebook',
        value: annotation.notebookId
      }],
      textQuote: isFullPage ? undefined : annotation.subject?.selected?.text,
      validation: {
        required: {
          condition: isFullPage ? 'OR' : 'AND'
        }
      }
    } as EditModalParams;

    if (mode === 'comment') {
      params.sections.push({
        id: 'comment',
        value: annotation.type === 'Commenting' ? annotation.content?.comment : undefined,
        focus: true,
        required: isFullPage,
      });
    } else if (mode === 'semantic') {
      params.sections.push({
        id: 'semantic',
        value: annotation.type === 'Linking' ? this.getSemanticData(annotation.content) : undefined,
        focus: true,
        required: isFullPage,
      });
      params.saveButtonLabel = _t('editmodal#save_semantic');
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
      let objectType = null;
      // literal
      if ('text' in triple.object) {
        object = {
          label: triple.object.text,
          uri: null
        };
        objectType = 'literal';
        // uri as free-text
      } else if ('uri' in triple.object && triple.object.source === 'free-text') {
        object = {
          label: triple.object.uri,
          uri: triple.object.uri,
        };
        objectType = 'uri';
        // uri
      } else if ('uri' in triple.object && triple.object.source === 'search') {
        object = {
          label: triple.object.label,
          uri: triple.object.uri,
        };
        objectType = 'uri';
        // web page
      } else if ('pageTitle' in triple.object) {
        object = {
          label: triple.object.pageTitle,
          uri: null,
        };
        // TODO: add webpage object type
        // objectType = '';
      } else {
        console.warn('No handler for semantic object', triple.object);
      }
      return { predicate, object, objectType };
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

  private onFullPageAnnotationCreate = (payload: any) => {
    const pendingAnnotation = this.layoutDS.addPendingAnnotation();
    this.layoutDS.removePendingAnnotation();
    this.layoutDS.anchorService.add(pendingAnnotation);

    const openModalConfig = this.buildEditModalConf(pendingAnnotation, payload);
    this.layoutDS.openEditModal(openModalConfig);
  }

  private buildEditModalConf = (pendingAnnotation: Annotation, type: string): EditModalParams => {
    const isTagging = type !== 'tagging ';

    const sections = [{
      id: 'tags',
      required: true,
      focus: isTagging
    }, {
      id: 'notebook'
    }];
    if (type === 'commenting') {
      sections.push({
        id: 'comment',
        required: true,
        focus: true
      });
    } else if (type === 'linking') {
      sections.push({
        id: 'semantic',
        required: true,
        focus: true
      });
    }
    return {
      textQuote: pendingAnnotation.subject.pageTitle || pendingAnnotation.subject.pageContext,
      validation: {
        required: {
          condition: isTagging ? 'OR' : 'AND'
        }
      },
      sections
    };
  }
}
