import { EventHandler } from '@n7-frontend/core';

export class AnnotationEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type }) => {
      switch (type) {
        default:
          console.warn('unhandled inner event of type', type);
          break;
      }
    });
  }
}
