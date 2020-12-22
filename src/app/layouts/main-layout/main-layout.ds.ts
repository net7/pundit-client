import { LayoutDataSource } from '@n7-frontend/core';
import { selectionHandler } from 'src/app/models/selection/selection-handler';
import { create as createAnnotation } from 'src/app/models/annotation/create';
import tooltipHandler from 'src/app/models/tooltip-handler';
import { highlightRange } from 'src/app/models/highlighter';
import { Observable, of } from 'rxjs';
import searchMock from 'src/app/mocks/search.mock';

export class MainLayoutDS extends LayoutDataSource {
  // FIXME: mettere type definitivi
  onInit(): Observable<any> {
    // FIXME: collegare a communication
    return of(searchMock);
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
    const annotation = createAnnotation('test', 'test', range);
    highlightRange(range);
    selectionHandler.clearSelection();
    tooltipHandler.hide();
    console.log(JSON.stringify(annotation));
    console.warn('TODO: gestire salvataggio highlight', annotation);
  }

  onAnnotationDelete(id: string) {
    console.warn('TODO: gestire annotation delete', id);
  }
}
