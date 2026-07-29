import { EventHandler } from "@net7/core";
import { EditModalDS } from "../data-sources";
import { EditModalEvent, getEventType, MainLayoutEvent } from "../event-types";

export class EditModalEH extends EventHandler {
  public dataSource!: EditModalDS;

  public listen() {
    this.innerEvents$.subscribe(({ type, payload }) => {
      this.handleInnerEvent(type, payload);
    });

    this.outerEvents$.subscribe(({ type, payload }) => {
      this.handleOuterEvent(type, payload);
    });
  }

  private emitSimpleEvent(eventType: string) {
    this.emitOuter(getEventType(eventType));
  }

  private handleInnerEvent(type: string, payload: any) {
    const simpleEvents: string[] = [
      EditModalEvent.NotebookChange,
      EditModalEvent.CreateNotebookSuccess,
      EditModalEvent.AiGenerated,
      EditModalEvent.AiAccept,
      EditModalEvent.AiDiscard,
    ];

    if (simpleEvents.includes(type)) {
      this.emitSimpleEvent(type);
      return;
    }

    switch (type) {
      case EditModalEvent.Close:
        this.dataSource.close();
        this.emitSimpleEvent(EditModalEvent.Close);
        break;
      case EditModalEvent.Save:
        this.emitOuter(getEventType(EditModalEvent.Save), payload);
        break;
      case EditModalEvent.CreateNotebookError:
        this.emitOuter(
          getEventType(EditModalEvent.CreateNotebookError),
          payload,
        );
        break;
      case EditModalEvent.NotebookSelectorModeChanged:
        this.dataSource.changeActionsVisibility(payload === "input");
        break;
      case EditModalEvent.AiGenerate:
        this.emitOuter(getEventType(EditModalEvent.AiGenerate), payload);
        break;
      default:
        break;
    }
  }

  private handleOuterEvent(type: string, payload: any) {
    switch (type) {
      case MainLayoutEvent.ClickTooltip:
        if (payload === "highlight") {
          this.closeModal();
        }
        break;
      case MainLayoutEvent.AnnotationCreated:
      case MainLayoutEvent.KeyUpEscape:
        this.closeModal();
        break;
      case EditModalEvent.AiGenerated:
        this.dataSource.setAiPreviewActive(true);
        break;
      case EditModalEvent.AiDiscard:
        this.dataSource.setAiPreviewActive(false);
        break;
      default:
        break;
    }
  }

  /**
   * Closes the modal if it is currently visible.
   */
  private closeModal() {
    if (this.dataSource.isVisible()) {
      this.dataSource.close();
      this.emitOuter("close");
    }
  }
}
