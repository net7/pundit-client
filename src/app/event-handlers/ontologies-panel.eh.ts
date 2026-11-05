import { EventHandler } from '@net7/core';
import { getEventType, OntologiesPanelEvent } from '../event-types';

export class OntologiesPanelEH extends EventHandler {
  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      switch (type) {
        case OntologiesPanelEvent.Toggle:
        case OntologiesPanelEvent.ToggleCategory:
          this.emitOuter(getEventType(type), payload);
          break;
        default:
          break;
      }
    });
  }
}
