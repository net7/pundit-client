import {
  AfterContentChecked,
  OnInit,
  OnDestroy,
  Component,
  Input,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from "@angular/core";
import { FormSectionData } from "src/app/types";
import Draggable from "draggable";
import { merge, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { isEmpty } from "lodash";
import { EditModalEvent, getEventType } from "src/app/event-types";
import { SvgIconComponent } from "../svg-icon/svg-icon";
import { CommentSectionComponent } from "./sections/comment-section/comment-section";
import { SemanticSectionComponent } from "./sections/semantic-section/semantic-section";
import { TagsSectionComponent } from "./sections/tags-section/tags-section";
import { NotebookSectionComponent } from "./sections/notebook-section/notebook-section";
import { AiRequestSectionComponent } from "./sections/aiRequest-section/request-section";

/**
 * Interface for EditModal's "data"
 */
export interface EditModalData {
  textQuote: string;
  visible: boolean;
  header: {
    label: string;
  };
  sections: {
    [id: string]: FormSectionData<unknown, unknown>;
  };
  actions: {
    cancel: EditModalAction;
    save: EditModalAction;
  };
  validation?: {
    required?: {
      condition: "AND" | "OR";
    };
  };
  hideActions?: boolean;
  aiPreviewActive?: boolean;
  lastPrompt?: string;
  _setDraggableInstance: (instance: any) => void;
  _internalId: string;
}

export type EditModalAction = {
  label: string;
  classes?: string;
  disabled?: boolean;
};

export type EditModalFormState = {
  [id: string]: {
    value: unknown;
    errors?: string[];
  };
};

// Subject condiviso per comunicare tra handler e componente
export const aiPreviewState$ = new Subject<boolean>();

@Component({
  selector: "pnd-edit-modal",
  templateUrl: "./edit-modal.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SvgIconComponent,
    CommentSectionComponent,
    SemanticSectionComponent,
    TagsSectionComponent,
    NotebookSectionComponent,
    AiRequestSectionComponent,
  ],
})
export class EditModalComponent
  implements AfterContentChecked, OnInit, OnDestroy
{
  private changeDetectorRef = inject(ChangeDetectorRef);

  @ViewChild("saveButton") saveButton!: ElementRef;

  @Input() public data!: EditModalData;

  @Input() public emit!: (type: string, payload?: any) => void;

  private lastInternalId: string | null = null;

  private loaded = false;

  private formState: EditModalFormState = {};

  private lastPrompt = "";

  public draggableTarget = "pnd-modal-draggable-target";

  public draggableHandle = "pnd-modal-draggable-handle";

  public draggableInstance: any;

  public reset$: Subject<void> = new Subject();

  private destroy$ = new Subject<void>();

  public get aiPreviewActive(): boolean {
    return this.data?.aiPreviewActive === true;
  }

  public get disableGenerate(): boolean {
    const textValue = typeof this.value === "string" && this.value.trim();
    if (!textValue || textValue.length < 3) {
      return true;
    }
    return textValue === this.lastPrompt;
  }

  ngAfterContentChecked() {
    this.init();
  }

  ngOnInit() {
    // Ascolta lo stato della preview AI
    aiPreviewState$.pipe(takeUntil(this.destroy$)).subscribe((active) => {
      this.data = { ...this.data, aiPreviewActive: active as boolean };
      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== "pnd-comment-modal__overlay") {
      return;
    }
    this.emit(getEventType(EditModalEvent.Close));
  }

  onSave() {
    this.emit(getEventType(EditModalEvent.Save), this.formState);
  }

  onAiGenerate(prompt: string) {
    this.emit(getEventType(EditModalEvent.AiGenerate), prompt);
  }

  onAiAccept() {
    this.emit(getEventType(EditModalEvent.AiAccept));
  }

  onAiDiscard() {
    this.emit(getEventType(EditModalEvent.AiDiscard));
  }

  get value(): string {
    return (this.formState?.aiRequest?.value as string) || "";
  }

  onGenerate() {
    const textValue = typeof this.value === "string" && this.value.trim();
    if (textValue && textValue.length >= 3) {
      this.lastPrompt = textValue;
      this.emit(getEventType(EditModalEvent.AiGenerate), textValue);
    }
  }

  private init = () => {
    if (
      this.data?._internalId &&
      this.data?._internalId !== this.lastInternalId
    ) {
      this.lastInternalId = this.data?._internalId;
      this.loaded = false;
      this.lastPrompt = "";
      setTimeout(() => {
        this.reset$.next();
        this.changeDetectorRef.markForCheck();
      });
    }
    if (!this.loaded && this.data?.visible) {
      this.loaded = true;
      this.initDraggableInstance();
      this.initFormState();
      this.initChangedListener();
    }
  };

  private initDraggableInstance = () => {
    setTimeout(() => {
      const { shadowRoot } = document.getElementsByTagName("pnd-root")[0];
      const target = shadowRoot!.getElementById(this.draggableTarget);
      const handle = shadowRoot!.getElementById(this.draggableHandle);
      const limit = this.getDragLimit(target);
      this.draggableInstance = new Draggable(target, { handle, limit });
      this.data._setDraggableInstance(this.draggableInstance);
      this.changeDetectorRef.markForCheck();
    });
  };

  private initFormState = () => {
    this.formState = {};
    const { sections } = this.data;
    this.formState = Object.keys(sections).reduce<EditModalFormState>(
      (state, key) => {
        const { initialValue } = sections[key];
        return {
          ...state,
          [key]: {
            value: initialValue || null,
          },
        };
      },
      {},
    );
    this.updateSaveButtonState();
  };

  private initChangedListener = () => {
    const { sections } = this.data;
    const sources$ = Object.keys(sections).map((key) => sections[key].changed$);
    merge(...sources$).subscribe(({ id, value, errors }) => {
      this.formState = {
        ...this.formState,
        [id]: { value, errors },
      };
      this.updateSaveButtonState();
    });
  };

  private updateSaveButtonState() {
    const { sections, validation } = this.data;
    const sectionErrors = Object.keys(sections).map((key) => {
      const currentSectionErrors = this.formState[key]?.errors;
      return !!(
        Array.isArray(currentSectionErrors) && currentSectionErrors.length
      );
    });

    const requiredErrors = Object.keys(sections).map((key) => {
      const sectionValue = this.formState[key]?.value;
      return !!(sections[key].required && isEmpty(sectionValue));
    });

    const hasSectionErrors = !!sectionErrors.find((value) => !!value);
    const hasRequiredErrors = !!requiredErrors.find((value) => !!value);
    let disabled = false;
    if (hasSectionErrors) {
      disabled = true;
    } else if (hasRequiredErrors) {
      const numOfErrors = requiredErrors.filter((value) => !!value).length;
      const isOrCondition = validation?.required?.condition === "OR";
      disabled = !!(isOrCondition
        ? numOfErrors === requiredErrors.length - 1
        : numOfErrors);
    }
    this.data = {
      ...this.data,
      actions: {
        ...this.data.actions,
        save: {
          ...this.data.actions.save,
          disabled,
        },
      },
    };
    this.changeDetectorRef.markForCheck();
  }

  private getDragLimit = (target: any) => {
    if (!target) {
      return null;
    }
    const vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0,
    );
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0,
    );
    const tw = Math.max(target.clientWidth || 200);
    const th = Math.max(target.clientHeight || 200);
    return { x: [0, vw - tw], y: [0, vh - th] };
  };
}
