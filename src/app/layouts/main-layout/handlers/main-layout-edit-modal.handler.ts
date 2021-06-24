import { EditModalEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutEditModalHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  listen() {
    this.layoutEH.outerEvents$.subscribe(({ type }) => {
      switch (type) {
        case EditModalEvent.Close:
          this.onEditModalClose();
          break;
        default:
          break;
      }
    });
  }

  private onEditModalClose() {
    // clear pending
    this.layoutDS.removePendingAnnotation();
  }
}
