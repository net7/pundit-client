import { TooltipEvent } from 'src/app/events';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class TooltipHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  public listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case TooltipEvent.Click: {
          this.onTooltipClick(payload);
          break;
        }
        // TODO
        default:
          break;
      }
    });
  }

  private onTooltipClick(payload) {
    // TODO
    console.log('TooltipHighlight----------------------------->', payload);
  }
}
