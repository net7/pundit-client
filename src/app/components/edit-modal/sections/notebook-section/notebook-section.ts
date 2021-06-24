import {
  AfterContentChecked,
  Component,
  Input,
} from '@angular/core';
import { _t } from '@n7-frontend/core';
import { NotebookSelectorData } from 'src/app/components/notebook-selector/notebook-selector';
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
export class NotebookSectionComponent implements AfterContentChecked, FormSection<
  NotebookSectionValue, NotebookSectionOptions
> {
  id = 'notebook';

  @Input() public data: FormSectionData<NotebookSectionValue, NotebookSectionOptions>;

  private loaded = false;

  public notebookSelectorData: NotebookSelectorData;

  public currentNotebook: NotebookData = null;

  constructor(
    private notebookService: NotebookService,
    private userService: UserService
  ) {}

  ngAfterContentChecked() {
    this.init();
  }

  private init = () => {
    if (!this.loaded) {
      this.loaded = true;

      const { notebookId } = this.data.options;
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
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onChange = (type, payload) => {
    console.log('type----------------------------->', type, payload);
    if (type === 'option') {
      const value = this.currentNotebook.id !== payload ? payload : null;
      this.data.changed$.next({
        value,
        id: this.id,
      });
    }
  }
}
