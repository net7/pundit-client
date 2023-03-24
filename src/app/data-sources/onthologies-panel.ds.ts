import { DataSource, _t } from '@net7/core';
import { OnthologiesPanelData, OnthologyItem } from '../components/onthologies-panel/onthologies-panel';

export class OnthologiesPanelDS extends DataSource {
  protected transform(items: OnthologyItem[]): OnthologiesPanelData {
    return {
      title: _t('onthologiespanel#title'),
      description: _t('onthologiespanel#description'),
      items
    };
  }

  onItemClick(item: OnthologyItem) {
    item.selected = !item.selected;
  }

  getSelected = () => this.output.items.filter(({ selected }) => selected);
}
