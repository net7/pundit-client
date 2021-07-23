import { ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { _t } from "@n7-frontend/core";
import { Annotation } from "@pundit/communication";
import { BehaviorSubject, Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { _c } from "src/app/models/config";
import { ImageDataService } from "src/app/services/image-data.service";
import { NotebookService } from "src/app/services/notebook.service";
import { UserData, UserService } from "src/app/services/user.service";

@Component({
  selector: "pnd-header-annotation-section",
  templateUrl: "./header-annotation-section.html",
})
export class HeaderAnnotationSectionComponent implements OnInit {
  id = "header";

  @Input() public data$: BehaviorSubject<Annotation>;

  @Input() public emit: any;

  @Input() public state$: any;

  @Input() public annotationId: string;


  constructor(
    private ref: ChangeDetectorRef,
    private userService: UserService,
    private notebookService: NotebookService,
    public imageDataService: ImageDataService,
  ) {}

  public header$: Observable<any>;

  ngOnInit(): void {
    this.header$ = this.data$.pipe(map(this.transformData),tap(data=>console.log("HEADER",data)));
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
  }

  private transformData = (annotation: Annotation): any => {
    return { 
        user: this.getUserData(annotation.userId),
        notebook: this.getNotebookData(annotation),
        date: new Date(annotation.created).toLocaleDateString(),
    };
  };

  private getUserData(userId: string) {
    const user = this.userService.getUserById(userId);
    let separator = ' ';
    // is email check
    if (user.username.includes('@')) {
      separator = '@';
    }
    const initials = (user.username as string)
      .split(separator)
      .map((word: string) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return {
      initials,
      image: user.thumb || _c('userDefaultThumb'),
      name: user.username,
      anchor: this.isCurrentUser(user)
        ? _c('userLink')
        : null
    };
  }

  private isCurrentUser(user: UserData) {
    const currentUser = this.userService.whoami();
    return user.id === currentUser?.id;
  }


  private getNotebookData(annotation: Annotation) {
    const notebook = this.notebookService.getNotebookById(annotation.notebookId);
    const user = this.userService.getUserById(annotation.userId);
    return {
      name: notebook.label,
      anchor: this.isCurrentUser(user)
        ? this.getNotebookLink(notebook.id)
        : null
    };
  }

  private getNotebookLink = (id: string) => `${_c('notebookLink')}/${id}`


  onClick(ev: Event, payload) {
    if (!this.emit) return;
    ev.stopImmediatePropagation();
    this.emit('click', payload);

    // trigger change detector
    this.ref.detectChanges();
  }

}
