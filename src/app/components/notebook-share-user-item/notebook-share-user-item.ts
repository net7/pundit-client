import { Component, Input } from '@angular/core';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookShareListItem } from '../notebook-share-modal/notebook-share-modal';

@Component({
  selector: 'pnd-notebook-share-user-item',
  templateUrl: './notebook-share-user-item.html',
})
export class NotebookShareUserItemComponent {
  @Input() item: NotebookShareListItem;

  @Input() emit: (type: string, payload?: unknown) => void;

  constructor(
    public imageDataService: ImageDataService
  ) {}

  dropdownToggle(item) {
    item.dropdown.isExpanded = !item.dropdown.isExpanded;
  }

  onActionClick(payload, item) {
    if (!this.emit) return;

    item.dropdown.isExpanded = !item.dropdown.isExpanded;
    this.emit('actionclick', payload);
  }
}
