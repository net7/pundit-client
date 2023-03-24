import { _t } from '@net7/core';
import { OnthologyItem } from 'src/app/components/onthologies-panel/onthologies-panel';
import { OnthologiesPanelEvent } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { SidebarLayoutDS } from '../sidebar-layout.ds';
import { SidebarLayoutEH } from '../sidebar-layout.eh';

export class SidebarLayoutOnthologiesPanelHandler implements LayoutHandler {
  constructor(
    private layoutDS: SidebarLayoutDS,
    private layoutEH: SidebarLayoutEH
  ) {}

  public listen() {
    this.layoutEH.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case OnthologiesPanelEvent.ChangeSelected: // change selected onthologies
          this.setSelected(payload);
          break;

        default:
          break;
      }
    });
  }

  private setSelected(items: OnthologyItem[]) {
    const workingToast = this.layoutEH.toastService.working();

    this.layoutDS.semanticOnthologiesService.setSelected(items.map(({ id }) => id))
      .subscribe(() => {
        workingToast.close();

        // toast
        this.layoutEH.toastService.success({
          title: _t('toast#onthologiessetselected_success_title'),
          text: _t('toast#onthologiessetselected_success_text'),
        });
      });
  }
}
