import { MainLayoutDS } from './main-layout.ds';
import { MainLayoutEH } from './main-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';
import {
  MainLayoutAnchorHandler,
  MainLayoutAppEventsHandler,
  MainLayoutEditModalHandler,
  MainLayoutDeleteModalHandler,
  MainLayoutLoginHandler,
  MainLayoutSelectionHandler,
  MainLayoutTooltipHandler,
  MainLayoutWindowEventsHandler
} from './handlers';

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
    { id: 'edit-modal' },
  ],
  layoutDS: MainLayoutDS,
  layoutEH: MainLayoutEH,
  handlers: [
    MainLayoutTooltipHandler,
    MainLayoutEditModalHandler,
    MainLayoutDeleteModalHandler,
    MainLayoutSelectionHandler,
    MainLayoutAppEventsHandler,
    MainLayoutAnchorHandler,
    MainLayoutLoginHandler,
    MainLayoutWindowEventsHandler
  ],
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
