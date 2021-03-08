import { LayoutBuilder } from '@n7-frontend/core';

export abstract class AbstractLayout {
  protected config: any;

  protected widgets: any[];

  public lb: any;

  constructor(config: any) {
    this.config = config;
    this.widgets = this.config.widgets;
    this.lb = new LayoutBuilder(this.config.layoutId);
  }

  protected abstract initPayload(): any;

  protected onInit() {
    // on ready
    this.lb.ready$.subscribe(() => {
      this.lb.eventHandler.emitInner('init', this.initPayload());
    });

    const LayoutDS = this.config.layoutDS;
    const LayoutEH = this.config.layoutEH;
    const layoutDSInstance = new LayoutDS();
    const layoutEHInstance = new LayoutEH();

    // init
    this.lb.init({
      widgetsConfig: this.widgets,
      widgetsDataSources: this.config.widgetsDataSources,
      widgetsEventHandlers: this.config.widgetsEventHandlers,
      dataSource: layoutDSInstance,
      eventHandler: layoutEHInstance,
    });

    // handlers
    if (Array.isArray(this.config.handlers)) {
      this.config.handlers.forEach((HandlerClass) => {
        const handlerInstance = new HandlerClass(
          layoutDSInstance,
          layoutEHInstance
        );
        handlerInstance.listen();
      });
    }
  }

  protected onDestroy() {
    this.lb.eventHandler.emitInner('destroy');
  }
}
