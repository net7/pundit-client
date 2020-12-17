import { EventHandler } from '@n7-frontend/core';

export class AnnotationEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'annotation.click':
          this.emitOuter('collapse', payload);
          break;
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }
}
