import { MainLayoutDS } from './main-layout.ds';
import { MainLayoutEH } from './main-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';

export const MainLayoutConfig = {
  layoutId: 'main-layout',
  widgets: [
    { id: 'comment-modal' },
    {
      id: 'tooltip',
      hasStaticData: true
    },
  ],
  layoutDS: MainLayoutDS,
  layoutEH: MainLayoutEH,
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
