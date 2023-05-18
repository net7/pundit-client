import {
  ChangeDetectorRef, Component, Input, OnDestroy, OnInit
} from '@angular/core';
import { Annotation } from '@pundit/communication';
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
import {
  ActionButtonConfig,
  // blockEditAction,
  menuActionButtons,
  menuIconButton,
  menuNotebookSection
} from './menu-data.helper';
import { shareActionButtons, shareButton } from './menu-share.helper';

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
  ) {}

  ngOnInit(): void {
    this.menu$ = this.data$.pipe(map(this.transformData));
    this.state$
      .pipe(withLatestFrom(this.data$), takeUntil(this.destroy$))
      .subscribe(([state, data]) => {
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
    const shareData = this.getShareData(annotation);
    return {
      menuData,
      shareData
    };
  };

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
      type: annotation.type,
      hasTags: !!annotation.tags?.length,
      // avoidEdit: blockEditAction(annotation),
    };
    const currentUser = this.userService.whoami();
    const currentUserNotebooks = currentUser
      ? this.notebookService.getByUserId(currentUser.id)
      : [];
    return this.isCurrentUser(user)
      ? {
        icon: menuIconButton(id),
        actions: menuActionButtons(buttonConfig),
        notebooks: menuNotebookSection(id, currentUserNotebooks),
      }
      : null;
  }

  private getShareData(annotation: Annotation) {
    const { id } = annotation;
    const actionsConfig = {
      id,
    };
    const isPrivate = this.notebookService.getNotebookById(annotation.notebookId)?.sharingMode
      !== 'public';
    return isPrivate
      ? null
      : {
        icon: shareButton(id),
        actions: shareActionButtons(actionsConfig),
      };
  }

  onClick(ev: Event, payload) {
    if (!this.emit) return;
    ev.stopImmediatePropagation();

    const currentState = this.state$.getValue();
    const { activeMenu } = currentState;
    const { source } = payload;
    if (
      (activeMenu === 'actions' && source === 'menu-header')
      || (activeMenu === 'share' && source === 'menu-share')
    ) {
      this.state$.next({
        ...currentState,
        activeMenu: undefined
      });
    } else {
      this.emit('click', payload);
    }

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
}
