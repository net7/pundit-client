import {
  AfterContentChecked,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { _t } from '@n7-frontend/core';
import { EMPTY, Subject } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NotebookSelectorData } from 'src/app/components/notebook-selector/notebook-selector';
import { EditModalEvent, getEventType } from 'src/app/event-types';
import { NotebookData, NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { FormSection, FormSectionData } from 'src/app/types';

export type NotebookSectionValue = string;

export type NotebookSectionOptions = {
  notebookId: string;
}

@Component({
  selector: 'pnd-notebook-section',
  templateUrl: './notebook-section.html'
})
export class NotebookSectionComponent implements OnInit, AfterContentChecked, FormSection<
  NotebookSectionValue, NotebookSectionOptions
> {
  id = 'notebook';

  @Input() public data: FormSectionData<NotebookSectionValue, NotebookSectionOptions>;

  @Input() public emit: (type: string, payload?: any) => void;

  @Input() public reset$: Subject<void>;

  private loaded = false;

  public notebookSelectorData: NotebookSelectorData;

  public currentNotebook: NotebookData = null;

  constructor(
    private notebookService: NotebookService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.reset$.subscribe(this.onReset);
  }

  ngAfterContentChecked() {
    this.init();
  }

  private init = () => {
    if (!this.loaded) {
      this.loaded = true;

      const { notebookId } = this.data.options;
      this.setNotebookSelectorData(notebookId);
    }
  }

  private setNotebookSelectorData(notebookId: string) {
    const notebooks = this.notebookService.getByUserId(this.userService.whoami().id);
    this.currentNotebook = this.notebookService.getSelected();

    if (notebookId) {
      this.currentNotebook = this.notebookService.getNotebookById(notebookId);
    }

    this.notebookSelectorData = {
      selectedNotebook: this.currentNotebook,
      notebookList: notebooks,
      mode: 'select',
      createOption: {
        label: _t('commentmodal#notebook_create'),
        value: 'create'
      }
    };
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onEmit = (type, payload) => {
    if (type === 'option') {
      if (this.currentNotebook.id !== payload) {
        this.triggerChanged(payload);
      }
    } else if (type === 'createnotebook') {
      this.createNotebook(payload);
    } else if (type === 'modechanged') {
      this.emit(getEventType(EditModalEvent.NotebookSelectorModeChanged), payload);
    }
  }

  private createNotebook(label: string) {
    // update state
    this.notebookSelectorData.isLoading = true;
    this.notebookService.create(label).pipe(
      catchError((e) => {
        // emit signal
        this.emit(getEventType(EditModalEvent.CreateNotebookError), e);

        return EMPTY;
      }),
      finalize(() => {
        // reset state
        this.resetDropdownState();
      })
    ).subscribe(({ data }) => {
      this.triggerChanged(data.id);

      // emit signal
      this.emit(getEventType(EditModalEvent.CreateNotebookSuccess));
    });
  }

  private triggerChanged(notebookId: string) {
    this.setNotebookSelectorData(notebookId);
    this.data.changed$.next({
      value: notebookId,
      id: this.id,
    });
  }

  private resetDropdownState() {
    const mode = 'select';
    this.notebookSelectorData.isLoading = false;
    this.notebookSelectorData.mode = mode;
    // emit signal
    this.emit(getEventType(EditModalEvent.NotebookSelectorModeChanged), mode);
  }

  private onReset = () => {
    const { initialValue } = this.data;
    this.resetDropdownState();
    this.setNotebookSelectorData(initialValue);
  }
}
