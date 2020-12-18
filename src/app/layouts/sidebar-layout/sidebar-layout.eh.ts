import { ActivatedRoute } from '@angular/router';
import { EventHandler } from '@n7-frontend/core';

export class SidebarLayoutEH extends EventHandler {
  private route: ActivatedRoute;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'sidebar-layout.init':
          this.dataSource.onInit(payload);
          this.route = payload.route;
          // this.listenRoute();
          break;
        case 'sidebar-layout.destroy':
          break;
        case 'sidebar-layout.clicklogo':
          // open the sidebar
          this.dataSource.isCollapsed.next(false);
          break;
        case 'sidebar-layout.sidebarclose':
          // Close the sidebar
          this.dataSource.isCollapsed.next(true);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
    this.outerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'annotation.collapse':
          if (payload.uid) {
            const a = this.dataSource.annotations.find((d) => d._meta === payload.uid);
            if (a) {
              a.isCollapsed = !a.isCollapsed;
            }
          }
          break;
        default:
          break;
      }
    });
  }

  // private listenRoute() {
  //   this.route.paramMap.subscribe((params) => {
  //     const paramId = params.get('id');
  //     if (paramId) {
  //       if (paramId) {
  //         this.dataSource.currentId = paramId;
  //         this.emitOuter('routechanged', paramId);
  //       }
  //     }
  //   });
  // }
}
