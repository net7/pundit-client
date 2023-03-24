import { Component, Input } from '@angular/core';
import { _t } from '@net7/core';

export type OnthologyItem = {
  id: string;
  label: string;
  category: string;
  types: string[];
  selected?: boolean;
}

export type OnthologiesPanelData = {
  title: string;
  description: string;
  items: OnthologyItem[];
  classes?: string;
}

@Component({
  selector: 'onthologies-panel',
  templateUrl: './onthologies-panel.html'
})
export class OnthologiesPanelComponent {
  @Input() data: OnthologiesPanelData;

  @Input() emit: (type: string, payload?: unknown) => void;

  public labels = {
    types: _t('onthologiespanel#types')
  }

  onClick(value) {
    if (!this.emit) return;
    this.emit('click', value);
  }
}
