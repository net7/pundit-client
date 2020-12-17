import { LayoutDataSource } from '@n7-frontend/core';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import tooltipHandler from 'src/app/models/tooltip-handler';

export class MainLayoutDS extends LayoutDataSource {
  onInit() {
    // do nothing
  }

  onSelectionChange() {
    const selection = selectionHandler.getCurrentSelection();
    if (selection) {
      tooltipHandler.show(selectionHandler.getCurrentSelection());
    } else {
      tooltipHandler.hide();
    }
  }
}
