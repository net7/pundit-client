import { SidebarLayoutDS } from './sidebar-layout.ds';
import { SidebarLayoutEH } from './sidebar-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';
import {
  SidebarLayoutAnnotationHandler,
  SidebarLayoutAppEventsHandler,
  SidebarLayoutNotebookPanelHandler,
  SidebarLayoutOntologiesPanelHandler
} from './handlers';

export const SidebarLayoutConfig = {
  layoutId: 'sidebar-layout',
  widgets: [
    { id: 'annotation' },
    { id: 'notebook-panel' },
    { id: 'ontologies-panel' },
  ],
  layoutDS: SidebarLayoutDS,
  layoutEH: SidebarLayoutEH,
  handlers: [
    SidebarLayoutNotebookPanelHandler,
    SidebarLayoutAnnotationHandler,
    SidebarLayoutAppEventsHandler,
    SidebarLayoutOntologiesPanelHandler,
  ],
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
