import { MainLayoutDS } from './main-layout.ds';
import { MainLayoutEH } from './main-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';
import { TooltipHandler } from './handlers';

export const MainLayoutConfig = {
  layoutId: 'main-layout',
  widgets: [
    { id: 'comment-modal' },
    {
      id: 'delete-modal',
      hasStaticData: true
    },
    {
      id: 'tooltip',
      hasStaticData: true
    },
  ],
  layoutDS: MainLayoutDS,
  layoutEH: MainLayoutEH,
  handlers: [TooltipHandler],
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
