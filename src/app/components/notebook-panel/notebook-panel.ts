import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { NotebookData, NotebookService } from '../../services/notebook.service';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { NgClass } from '@angular/common';
import { NotebookSelectorComponent } from '../notebook-selector/notebook-selector';
import { NotebookShareUserItemComponent } from '../notebook-share-user-item/notebook-share-user-item';

export interface NotebookPanelData {
  selected: NotebookData;
  list: NotebookData[];
  labels: {
    [key: string]: any;
  };
  icons: string;
  isLoading?: boolean;
  _meta?: any;
  usersList: any;
}

@Component({
    selector: 'notebook-panel',
    templateUrl: './notebook-panel.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SvgIconComponent, NgClass, NotebookSelectorComponent, NotebookShareUserItemComponent]
})
export class NotebookPanelComponent implements OnInit {
  userService = inject(UserService);
  notebookService = inject(NotebookService);

  @Input() public data!: NotebookPanelData;

  @Input() public emit: any;

  userId = this.userService.whoami().id;

  ngOnInit() {
    this.notebookService.getListOfUsers();
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onNotebookSelection = (type: string, payload: any) => {
    if (!this.emit) return;
    this.emit(type, payload);
  };

  onClick(type: string, payload: any) {
    if (!this.emit) return;
    this.emit('click', { ...payload, type });
  }

  onChange(payload: any) {
    if (!this.emit) return;
    this.emit('change', payload);
  }

  onShareClick() {
    if (!this.emit) return;
    this.emit('opensharemodal');
  }
}
