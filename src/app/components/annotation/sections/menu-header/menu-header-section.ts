import {
  ChangeDetectorRef, Component, Input, OnDestroy, OnInit
} from '@angular/core';
import { _t } from '@n7-frontend/core';
import { Annotation, AnnotationType } from '@pundit/communication';
import {
  BehaviorSubject, Observable, Subject
} from 'rxjs';
import {
  map, takeUntil, withLatestFrom
} from 'rxjs/operators';
import { NotebookSelectorData } from 'src/app/components/notebook-selector/notebook-selector';
import { AnnotationState } from 'src/app/services/annotation.service';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserData, UserService } from 'src/app/services/user.service';

type ButtonConfigType = AnnotationType | 'FullPage';

interface ActionButtonConfig {
  id: string;
  type: ButtonConfigType;
  hasTags?: boolean;
  avoidEdit?: boolean;
}

@Component({
  selector: 'pnd-menu-header-section',
  templateUrl: './menu-header-section.html',
})
export class MenuHeaderSectionComponent implements OnInit, OnDestroy {
  id = 'header';

  @Input() public data$: BehaviorSubject<Annotation>;

  @Input() public emit: any;

  @Input() public state$: BehaviorSubject<AnnotationState>;

  @Input() public annotationId: string;

  public menu$: Observable<any>;

  public notebookSelectorData: any;

  private destroy$: Subject<any> = new Subject();

  constructor(
    private ref: ChangeDetectorRef,
    private userService: UserService,
    private notebookService: NotebookService,
    public imageDataService: ImageDataService
  ) { }

  ngOnInit(): void {
    this.menu$ = this.data$.pipe(
      map(this.transformData)
    );
    this.state$.pipe(
      withLatestFrom(this.data$),
      takeUntil(this.destroy$)
    ).subscribe(([state, data]) => {
      if (!this.notebookSelectorData) {
        this.notebookSelectorData = this.newNotebookSelector(data, state);
      } else {
        this.notebookSelectorData = this.updateNotebookSelector(data, state);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private transformData = (annotation: Annotation) => {
    const menuData = this.getMenuData(annotation);
    return {
      menuData
    };
  }

  newNotebookSelector(annotation: Annotation, state: any) {
    const notebook = this.notebookService.getNotebookById(
      annotation.notebookId
    );
    const notebooks = this.notebookService.getByUserId(annotation.userId);
    const notebookSelectorData: NotebookSelectorData = {
      isLoading: state?.isNotebookSelectorLoading,
      selectedNotebook: notebook,
      notebookList: notebooks,
      mode: 'select',
      createOption: {
        label: 'New notebook',
        value: 'createnotebook',
      },
      _meta: {
        isExpanded: false,
      },
    };
    return notebookSelectorData;
  }

  updateNotebookSelector(annotation: Annotation, state: any) {
    if (state?.activeMenu !== 'notebooks') {
      return null;
    }
    if (!this.notebookSelectorData) {
      return this.newNotebookSelector(annotation, state);
    }
    this.notebookSelectorData.isLoading = state?.isNotebookSelectorLoading;
    const notebooks = this.notebookService.getByUserId(annotation.userId);
    const notebook = this.notebookService.getNotebookById(
      annotation.notebookId
    );
    this.notebookSelectorData.selectedNotebook = notebook;
    this.notebookSelectorData.notebookList = notebooks;

    return this.notebookSelectorData;
  }

  private isCurrentUser(user: UserData) {
    const currentUser = this.userService.whoami();
    return user.id === currentUser?.id;
  }

  private getMenuData(annotation: Annotation) {
    const { id } = annotation;
    const user = this.userService.getUserById(annotation.userId);
    const buttonConfig: ActionButtonConfig = {
      id,
      type: annotation.subject?.selected ? annotation.type : 'FullPage',
      hasTags: !!annotation.tags?.length,
      avoidEdit: this.blockEditAction(annotation)
    };
    const currentUser = this.userService.whoami();
    const currentUserNotebooks = currentUser
      ? this.notebookService.getByUserId(currentUser.id)
      : [];
    const actions = this.createActionButtons(buttonConfig);
    return this.isCurrentUser(user)
      ? {
        icon: {
          id: 'ellipsis-v',
          payload: {
            id,
            source: 'menu-header',
          },
        },
        actions,
        notebooks: {
          header: {
            label: _t('annotation#changenotebook'),
            payload: {
              id,
              source: 'notebooks-header',
            },
          },
          items: currentUserNotebooks.map(({ id: itemId, label }) => ({
            label,
            payload: {
              id,
              notebookId: itemId,
              source: 'notebook-item',
            },
          })),
        },
      }
      : null;
  }

  private createActionButtons(config: ActionButtonConfig) {
    const { id, type } = config;
    const actions = [
      {
        label: _t('annotation#changenotebook'),
        payload: {
          id,
          source: 'action-notebooks',
        },
      },
    ];

    // TODO REMOVE AFTER SEMANTIC MODAL IMPLEMENTATION
    if (!config?.avoidEdit) {
      if (type === 'Commenting') {
        actions.push(this.getActionButton(id, 'comment', 'edit'));
      } else if (type === 'Linking') {
        actions.push(this.getActionButton(id, 'semantic', 'edit'));
      } else if (type === 'Highlighting') {
        actions.push(this.getActionButton(id, 'comment', 'add'));
        actions.push(this.getActionButton(id, 'semantic', 'add'));
        actions.push(this.getActionButton(id, 'tags', config?.hasTags ? 'edit' : 'add'));
      } else {
        actions.push(this.getActionButton(id, 'fullpage', 'edit'));
      }
    }

    // and delete action
    actions.push({
      label: _t('annotation#delete'),
      payload: {
        id,
        source: 'action-delete',
      },
    });
    return actions;
  }

  private getActionButton(
    id: string,
    type: 'comment' | 'tags' | 'semantic' | 'fullpage',
    action: 'add' | 'edit'
  ) {
    return {
      label: _t(`annotation#${action}${type}`),
      payload: {
        id,
        source: `action-${type}`,
      },
    };
  }

  onClick(ev: Event, payload) {
    if (!this.emit) return;
    ev.stopImmediatePropagation();
    this.emit('click', payload);

    // trigger change detector
    this.ref.detectChanges();
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onNotebookSelection = (type, payload) => {
    if (!this.emit) return;
    // const annotationID = this.data.payload.id;
    const annotationID = this.annotationId;
    const notebookID = payload;
    if (!annotationID || !notebookID) return;
    this.emit(type, { annotation: annotationID, notebook: notebookID });

    // trigger change detector
    this.ref.detectChanges();
  };

  // TODO REMOVE AFTER SEMANTIC ANNOTATION IMPLEMENTATION
  private blockEditAction(annotation: Annotation): boolean {
    if (annotation.type !== 'Linking') {
      return false;
    }
    const triples = annotation.content;
    const hasObjectUri = triples.find((t) => t.objectType === 'uri' && t.object.source === 'search');
    const hasDate = triples.find((t) => t.objectType === 'date');
    const isFullpage = !!annotation.subject?.selected;
    return !!hasObjectUri || !!hasDate || isFullpage;
  }
}
