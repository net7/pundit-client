import { Component, Input, OnInit } from '@angular/core';
import { ImageDataService } from 'src/app/services/image-data.service';
import { NotebookShareModalData, NotebookShareModalResult } from '../notebook-share-modal/notebook-share-modal';

@Component({
  selector: 'pnd-notebook-share-user-selected',
  templateUrl: './notebook-share-user-selected.html'
})
export class NotebookShareUserSelectedComponent implements OnInit {
  @Input() data: NotebookShareModalData;

  actions = [
    { label: 'Can read', value: 'read' },
    { label: 'Can write', value: 'write' }
  ];

  item: NotebookShareModalResult;

  dropdownExpanded = false;

  statusLabel = this.actions[0].label;

  constructor(
    public imageDataService: ImageDataService
  ) {}

  ngOnInit(): void {
    this.item = this.data.body.confirmSection.selected;
    this.item.action = 'read';
  }

  dropdownToggle() {
    this.dropdownExpanded = !this.dropdownExpanded;
  }

  onActionClick(payload) {
    this.statusLabel = payload.label;
    this.item.action = payload.value;
    this.dropdownExpanded = !this.dropdownExpanded;
  }
}
