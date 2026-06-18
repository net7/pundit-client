import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookShareModalData, NotebookShareModalResult } from '../notebook-share-modal/notebook-share-modal';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'pnd-notebook-share-user-selected',
    templateUrl: './notebook-share-user-selected.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SvgIconComponent, AsyncPipe]
})
export class NotebookShareUserSelectedComponent implements OnInit {
  imageDataService = inject(ImageDataService);

  @Input() data!: NotebookShareModalData;

  actions = [
    { label: 'Can view', value: 'read' },
    { label: 'Can edit', value: 'write' }
  ];

  item!: NotebookShareModalResult;

  dropdownExpanded = false;

  statusLabel = this.actions[0].label;

  ngOnInit(): void {
    this.item = this.data.body.confirmSection!.selected;
    this.item.action = 'read';
  }

  dropdownToggle() {
    this.dropdownExpanded = !this.dropdownExpanded;
  }

  onActionClick(payload: any) {
    this.statusLabel = payload.label;
    this.item.action = payload.value;
    this.dropdownExpanded = !this.dropdownExpanded;
  }
}
