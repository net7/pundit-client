import { LayoutDataSource } from '@n7-frontend/core';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import tooltip from 'src/app/models/tooltip';

export class MainLayoutDS extends LayoutDataSource {
  onInit() {
    // do nothing
  }

  onSelectionChange() {
    tooltip.show(selectionHandler.getCurrentSelection());
  }
}
