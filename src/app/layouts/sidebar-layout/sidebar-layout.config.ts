import { SidebarLayoutDS } from './sidebar-layout.ds';
import { SidebarLayoutEH } from './sidebar-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';
import { SidebarLayoutAnnotationHandler, SidebarLayoutAppEventsHandler, SidebarLayoutNotebookPanelHandler } from './handlers';

export const SidebarLayoutConfig = {
  layoutId: 'sidebar-layout',
  widgets: [
    { id: 'annotation' },
    { id: 'notebook-panel' },
  ],
  layoutDS: SidebarLayoutDS,
  layoutEH: SidebarLayoutEH,
  handlers: [
    SidebarLayoutNotebookPanelHandler,
    SidebarLayoutAnnotationHandler,
    SidebarLayoutAppEventsHandler,
  ],
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
