import { MainLayoutDS } from './main-layout.ds';
import { MainLayoutEH } from './main-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';

export const MainLayoutConfig = {
  layoutId: 'pnd-main-layout',
  widgets: [
    // TODO
  ],
  layoutDS: MainLayoutDS,
  layoutEH: MainLayoutEH,
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
