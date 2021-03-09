import { takeUntil } from 'rxjs/operators';
import { AnchorEvent, AppEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutAnchorHandler implements LayoutHandler {
  constructor(
    private layoutDS: MainLayoutDS,
    private layoutEH: MainLayoutEH
  ) { }

  public listen() {
    this.layoutDS.anchorService.events$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(({ type, payload }) => {
      switch (type) {
        case AnchorEvent.MouseOver:
          this.layoutEH.appEvent$.next({
            payload,
            type: AppEvent.AnchorMouseOver
          });
          break;
        case AnchorEvent.MouseLeave:
          this.layoutEH.appEvent$.next({
            payload,
            type: AppEvent.AnchorMouseLeave
          });
          break;
        case AnchorEvent.Click:
          this.layoutEH.appEvent$.next({
            payload,
            type: AppEvent.AnchorClick,
          });
          break;
        default:
          break;
      }
    });
  }
}
