import { SidebarLayoutDS } from './sidebar-layout.ds';
import { SidebarLayoutEH } from './sidebar-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';
import {
  SidebarLayoutAnnotationHandler,
  SidebarLayoutAppEventsHandler,
  SidebarLayoutNotebookPanelHandler,
  SidebarLayoutOnthologiesPanelHandler
} from './handlers';

export const SidebarLayoutConfig = {
  layoutId: 'sidebar-layout',
  widgets: [
    { id: 'annotation' },
    { id: 'notebook-panel' },
    { id: 'onthologies-panel' },
  ],
  layoutDS: SidebarLayoutDS,
  layoutEH: SidebarLayoutEH,
  handlers: [
    SidebarLayoutNotebookPanelHandler,
    SidebarLayoutAnnotationHandler,
    SidebarLayoutAppEventsHandler,
    SidebarLayoutOnthologiesPanelHandler,
  ],
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
