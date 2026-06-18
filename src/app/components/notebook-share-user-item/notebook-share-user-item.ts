import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookShareListItem } from '../notebook-share-modal/notebook-share-modal';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'pnd-notebook-share-user-item',
    templateUrl: './notebook-share-user-item.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [SvgIconComponent, AsyncPipe]
})
export class NotebookShareUserItemComponent {
  imageDataService = inject(ImageDataService);

  @Input() item!: NotebookShareListItem;

  @Input() emit!: (type: string, payload?: unknown) => void;

  dropdownToggle(item: any) {
    item.dropdown.isExpanded = !item.dropdown.isExpanded;
  }

  onActionClick(payload: any, item: any) {
    if (!this.emit) return;

    item.dropdown.isExpanded = !item.dropdown.isExpanded;
    this.emit('actionclick', payload);
  }
}
