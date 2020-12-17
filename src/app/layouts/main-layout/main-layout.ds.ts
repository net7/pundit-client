import { LayoutDataSource } from '@n7-frontend/core';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { create as createAnnotation } from 'src/app/models/annotation/create';
import tooltipHandler from 'src/app/models/tooltip-handler';

export class MainLayoutDS extends LayoutDataSource {
  onInit() {
    // do nothing
  }

  onSelectionChange() {
    if (this.hasSelection()) {
      tooltipHandler.show(selectionHandler.getCurrentSelection());
    } else {
      tooltipHandler.hide();
    }
  }

  hasSelection = () => !!selectionHandler.getCurrentSelection();

  onHighlight() {
    const range = selectionHandler.getCurrentRange();
    const annotation = createAnnotation(range);

    console.warn('TODO: gestire salvataggio highlight', annotation);
  }
}
