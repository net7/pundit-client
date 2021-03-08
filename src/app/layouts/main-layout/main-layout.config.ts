import { MainLayoutDS } from './main-layout.ds';
import { MainLayoutEH } from './main-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';
import {
  MainLayoutAnchorHandler,
  MainLayoutAppEventsHandler,
  MainLayoutCommentModalHandler,
  MainLayoutDeleteModalHandler,
  MainLayoutLoginHandler,
  MainLayoutSelectionHandler,
  MainLayoutTooltipHandler
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
  ],
  layoutDS: MainLayoutDS,
  layoutEH: MainLayoutEH,
  handlers: [
    MainLayoutTooltipHandler,
    MainLayoutCommentModalHandler,
    MainLayoutDeleteModalHandler,
    MainLayoutSelectionHandler,
    MainLayoutAppEventsHandler,
    MainLayoutAnchorHandler,
    MainLayoutLoginHandler
  ],
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
