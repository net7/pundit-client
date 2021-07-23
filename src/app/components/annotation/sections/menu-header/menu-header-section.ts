import { ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { _t } from "@n7-frontend/core";
import { Annotation } from "@pundit/communication";
import { BehaviorSubject, Observable } from "rxjs";
import { map, tap, withLatestFrom } from "rxjs/operators";
import { NotebookSelectorData } from "src/app/components/notebook-selector/notebook-selector";
import { _c } from "src/app/models/config";
import { ImageDataService } from "src/app/services/image-data.service";
import { NotebookService } from "src/app/services/notebook.service";
import { UserData, UserService } from "src/app/services/user.service";

@Component({
  selector: "pnd-menu-header-section",
  templateUrl: "./menu-header-section.html",
})
export class MenuHeaderSectionComponent implements OnInit {
  id = "header";

  @Input() public data$: BehaviorSubject<Annotation>;

  @Input() public emit: any;

  @Input() public state$: any;

  @Input() public annotationId: string;

  public menu$: Observable<any>;

  constructor(
    private ref: ChangeDetectorRef,
    private userService: UserService,
    private notebookService: NotebookService,
    public imageDataService: ImageDataService
  ) {}

  ngOnInit(): void {
    this.menu$ = this.data$.pipe(
      withLatestFrom(this.state$),
      map(this.transformData),
      tap((data) => console.log("MENU", data))
    );
  }

  private transformData = ([annotation, state]: [Annotation, any]) => {
    const notebookSelectorData =
      state?.activeMenu === "notebooks"
        ? this.newNotebookSelector(annotation)
        : null;
    const menuData = this.getMenuData(annotation);
    return {
      menuData,
      notebookSelectorData,
    };
  }

  newNotebookSelector(annotation: Annotation) {
    const notebook = this.notebookService.getNotebookById(
      annotation.notebookId
    );
    const notebooks = this.notebookService.getByUserId(annotation.userId);
    const notebookSelectorData: NotebookSelectorData = {
      selectedNotebook: notebook,
      notebookList: notebooks,
      mode: "select",
      createOption: {
        label: "New notebook",
        value: "createnotebook",
      },
      _meta: {
        isExpanded: false,
      },
    };
    return notebookSelectorData;
  }

  private isCurrentUser(user: UserData) {
    const currentUser = this.userService.whoami();
    return user.id === currentUser?.id;
  }

  private getMenuData(annotation: Annotation) {
    const { id } = annotation;
    const user = this.userService.getUserById(annotation.userId);
    const hasComment = annotation.type === "Commenting";
    const hasTags = annotation.tags?.length;
    const hasSemantic = annotation.type === "Linking";
    const currentUser = this.userService.whoami();
    const currentUserNotebooks = currentUser
      ? this.notebookService.getByUserId(currentUser.id)
      : [];
    const actions = this.createActionButtons(
      id,
      hasComment,
      hasTags,
      hasSemantic
    );
    return this.isCurrentUser(user)
      ? {
          icon: {
            id: "ellipsis-v",
            payload: {
              id,
              source: "menu-header",
            },
          },
          actions,
          notebooks: {
            header: {
              label: _t("annotation#changenotebook"),
              payload: {
                id,
                source: "notebooks-header",
              },
            },
            items: currentUserNotebooks.map(({ id: itemId, label }) => ({
              label,
              payload: {
                id,
                notebookId: itemId,
                source: "notebook-item",
              },
            })),
          },
        }
      : null;
  }

  private createActionButtons(id: string, hasComment, hasTags, hasSemantic) {
    const actions = [
      {
        label: _t("annotation#changenotebook"),
        payload: {
          id,
          source: "action-notebooks",
        },
      },
    ];

    // annotation types actions logic
    if (hasComment) {
      actions.push(this.getActionButton(id, "comment", "edit"));
    } else if (hasSemantic) {
      actions.push(this.getActionButton(id, "semantic", "edit"));
    } else {
      actions.push(this.getActionButton(id, "comment", "add"));
      actions.push(this.getActionButton(id, "semantic", "add"));
      actions.push(this.getActionButton(id, "tags", hasTags ? "edit" : "add"));
    }

    // and delete action
    actions.push({
      label: _t("annotation#delete"),
      payload: {
        id,
        source: "action-delete",
      },
    });
    return actions;
  }

  private getActionButton(
    id: string,
    type: "comment" | "tags" | "semantic",
    action: "add" | "edit"
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
    this.emit("click", payload);

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
