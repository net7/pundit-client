import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookUserRole, NotebookUserStatus } from 'src/app/services/notebook.service';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { NotebookShareUserItemComponent } from '../notebook-share-user-item/notebook-share-user-item';
import { NotebookShareUserSelectedComponent } from '../notebook-share-user-selected/notebook-share-user-selected';
import { AsyncPipe } from '@angular/common';

export type NotebookShareModalResult = {
  username: string;
  email: string;
  thumb: string;
  hideEmail?: boolean;
  action?: 'read' | 'write';
};

export type NotebookShareListItem = {
  id: string | number;
  username: string;
  email: string;
  thumb: string;
  role: NotebookUserRole;
  status: NotebookUserStatus;
  roleAsLabel: string;
  statusAsLabel: string;
  action: string;
  actionAsLabel: string;
  dropdown?: {
    actions: {
      label: string;
      payload: any;
    }[];
    isExpanded?: boolean;
  };
};

export type NotebookShareModalData = {
  visible: boolean;
  header: {
    label: string;
  };
  body: {
    formSection: {
      text: string;
      autocomplete: {
        input: {
          placeholder: string;
        };
        results?: NotebookShareModalResult[];
      };
    };
    listSection: {
      title: string;
      items: NotebookShareListItem[];
    };
    confirmSection?: {
      text: string;
      selected: NotebookShareModalResult;
    };
  };
  invitationsList: Map<string, NotebookShareModalResult>;
  actions: {
    label: string;
    payload: any;
    classes?: string;
  }[];
}

@Component({
    selector: 'pnd-notebook-share-modal',
    templateUrl: './notebook-share-modal.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SvgIconComponent, NotebookShareUserItemComponent, NotebookShareUserSelectedComponent, AsyncPipe]
})
export class NotebookShareModalComponent {
  imageDataService = inject(ImageDataService);

  @Input() data!: NotebookShareModalData;

  @Input() emit!: (type: string, payload?: unknown) => void;

  onClick(ev: Event, payload: any) {
    if (!this.emit) return;

    ev.stopImmediatePropagation();
    this.emit('click', payload);
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'pnd-modal__overlay') {
      return;
    }
    this.emit('close');
  }

  onInput(payload: any) {
    if (!this.emit) return;

    this.emit('input', payload);
  }

  onAutocompleteClick(payload: any) {
    if (!this.emit) return;

    this.emit('autocompleteclick', payload);
  }

  onActionClick(payload: any) {
    if (!this.emit) return;

    this.emit('actionclick', payload);
  }

  dropdownToggle(item: any) {
    const items: NotebookShareListItem[] = this.data.body.listSection.items.map((listItem) => {
      if (listItem !== item) {
        return listItem;
      }
      const dropdown = listItem.dropdown!;
      return {
        ...listItem,
        dropdown: {
          actions: dropdown.actions,
          isExpanded: !dropdown.isExpanded
        }
      };
    });
    this.data = {
      ...this.data,
      body: {
        ...this.data.body,
        listSection: {
          ...this.data.body.listSection,
          items
        }
      }
    };
  }
}
