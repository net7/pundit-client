import { SidebarLayoutDS } from './sidebar-layout.ds';
import { SidebarLayoutEH } from './sidebar-layout.eh';
import * as DS from '../../data-sources';
import * as EH from '../../event-handlers';

export const SidebarLayoutConfig = {
  layoutId: 'sidebar-layout',
  widgets: [
    { id: 'annotation', hasStaticData: true }
  ],
  layoutDS: SidebarLayoutDS,
  layoutEH: SidebarLayoutEH,
  widgetsDataSources: DS,
  widgetsEventHandlers: EH,
  layoutOptions: {}
};
