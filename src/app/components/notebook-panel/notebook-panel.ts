import { Component, Input, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { NotebookData, NotebookService } from '../../services/notebook.service';

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
  templateUrl: './notebook-panel.html'
})
export class NotebookPanelComponent implements OnInit {
  @Input() public data: NotebookPanelData;

  @Input() public emit: any;

  userId = this.userService.whoami().id;

  constructor(
    public userService: UserService,
    public notebookService: NotebookService
  ) {}

  ngOnInit() {
    this.notebookService.getListOfUsers();
  }

  /**
   * Event emitter for the internal notebook-selector component
   */
  onNotebookSelection = (type, payload) => {
    if (!this.emit) return;
    this.emit(type, payload);
  }

  onClick(type, payload) {
    if (!this.emit) return;
    this.emit('click', { ...payload, type });
  }

  onChange(payload) {
    if (!this.emit) return;
    this.emit('change', payload);
  }

  onShareClick() {
    if (!this.emit) return;
    this.emit('opensharemodal');
  }
}
