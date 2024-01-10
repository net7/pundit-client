import { Component, Input, OnInit } from '@angular/core';
import { _t } from '@net7/core';
import { UserService } from 'src/app/services/user.service';
import { NotebookUserRole, NotebookUserStatus } from 'src/app/services/notebook.service';
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
  usersList;
}

@Component({
  selector: 'notebook-panel',
  templateUrl: './notebook-panel.html'
})
export class NotebookPanelComponent implements OnInit {
  @Input() public data: NotebookPanelData;

  @Input() public emit: any;

  userId = this.userService.whoami().id;

  usersList = [];

  constructor(
    public userService: UserService,
    public notebookService: NotebookService
  ) {}

  ngOnInit() {
    const notebookId = this.data.selected.id;
    return this.notebookService.search().subscribe((response) => {
      const selected = Object.assign(response.data.notebooks
        .find((item) => item.id === notebookId));
      const { users } = response.data;
      const readAccess = selected.userWithReadAccess
        .filter((item) => !selected.userWithWriteAccess.includes(item));
      const readPending = selected.userWithPendingReadingRequest
        .filter((item) => !selected.userWithPendingWritingRequest.includes(item));
      const userList = {
        owner: this.createOwner(users, this.userId),
        read: this.createUsers(readAccess, users, false, false),
        write: this.createUsers(selected.userWithWriteAccess, users, false, true),
        pendingRead: this.createUsers(readPending, users, true, false),
        pendingWrite: this.createUsers(selected.userWithPendingWritingRequest, users, true, true)
      };
      const userArray = userList.owner.concat(userList.read, userList.write,
        userList.pendingRead, userList.pendingWrite);
      this.usersList = userArray;
    });
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

  private createOwner(users, ownerId) {
    const owner = users.filter((item) => item.id === ownerId);
    let ownerItem = owner.map(({
      id, username, thumb, emailAddress
    }) => ({
      id,
      username,
      email: emailAddress,
      thumb,
      role: NotebookUserRole.Owner,
      status: NotebookUserStatus.Joined,
      action: ''
    }));
    ownerItem = this.transformUsers(ownerItem);
    return ownerItem;
  }

  private createUsers(array, users, isPending, canWrite) {
    const list = (isPending) ? array
      : users.filter((item) => array.find((element) => element === item.id));
    let userList = list.map((item) => ({
      id: (isPending) ? '' : item.id,
      username: (isPending) ? item : item.username,
      email: (isPending) ? item : item.emailAddress,
      thumb: (isPending) ? '' : item.thumb,
      role: NotebookUserRole.Editor,
      status: (isPending) ? NotebookUserStatus.Pending : NotebookUserStatus.Joined,
      action: (canWrite) ? 'write' : 'read'
    }));
    userList = this.transformUsers(userList);
    return userList;
  }

  private transformUsers(users) {
    return (users || []).map(({
      id, username, email, thumb, role, status, action
    }) => ({
      id,
      username,
      email,
      thumb,
      role,
      status,
      roleAsLabel: _t(`notebookshare#role_${role}`),
      statusAsLabel: _t(`notebookshare#status_${status}`),
      action,
      actionAsLabel: _t(`notebookshare#action_${action}`),
      dropdown: this.getDropdown(id, role, status, email, action)
    }));
  }

  private getDropdown(id: string, role: NotebookUserRole, status: NotebookUserStatus,
    email: string, permission: string) {
    if (role === NotebookUserRole.Owner) return null;
    const dropdown = {
      actions: [],
      isExpanded: false
    };
    let actionKeys = [];
    if (status === NotebookUserStatus.Pending) {
      actionKeys = ['delete_invite', 'resend_invite'];
    } else if (status === NotebookUserStatus.Joined) {
      actionKeys = ['remove'];
    } else if (status === NotebookUserStatus.Removed) {
      actionKeys = ['restore'];
    } else if (status === NotebookUserStatus.Selected) {
      actionKeys = ['read', 'write'];
    }
    dropdown.actions = actionKeys.map((action) => ({
      label: _t(`notebookshare#action_${action}`),
      payload: {
        id,
        action,
        email,
        permission
      }
    }));
    return dropdown;
  }

  ottieniData() {
    console.warn(this.data);
  }
}
