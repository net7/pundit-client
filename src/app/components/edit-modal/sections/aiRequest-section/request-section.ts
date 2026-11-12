import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  inject,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { _t } from "@net7/core";
import { FormSection, FormSectionData } from "src/app/types";

const TEXT_MIN_LIMIT = 3;

export type AiRequestSectionObjectValue = {
  prompt: string;
  annotationType: string;
};

export type AiRequestSectionValue = AiRequestSectionObjectValue | null;

export type AiRequestSectionOptions = {
  label: string;
  placeholder?: string;
};

@Component({
  selector: "pnd-ai-request-section",
  templateUrl: "./request-section.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiRequestSectionComponent
  implements
    AfterViewInit,
    OnDestroy,
    FormSection<AiRequestSectionValue, AiRequestSectionOptions>
{
  private changeDetectorRef = inject(ChangeDetectorRef);

  id = "aiRequest";

  @ViewChild("textarea")
  textarea!: ElementRef<HTMLTextAreaElement>;

  @Input() public data!: FormSectionData<
    AiRequestSectionValue,
    AiRequestSectionOptions
  >;

  @Input() public reset$!: Subject<void>;

  public value = "";
  public annotationType = "highlight";

  public placeholder = _t("editmodal#ai_placeholder");

  public annotationTypeLabel = _t("editmodal#ai_annotation_type");

  public annotationTypes = [
    { value: "comment", label: _t("editmodal#ai_type_comment") },
    { value: "highlight", label: _t("editmodal#ai_type_highlight") },
    { value: "tags", label: _t("editmodal#ai_type_tags") },
    { value: "semantic_annotation", label: _t("editmodal#ai_type_semantic") },
  ];

  private destroy$: Subject<void> = new Subject();

  ngAfterViewInit() {
    this.extractInitialValue();
    this.checkFocus();
    this.reset$.pipe(takeUntil(this.destroy$)).subscribe(this.onReset);
    this.changeDetectorRef.markForCheck();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(value: string) {
    this.value = value;
    this.emitChange();
  }

  onTypeChange(type: string) {
    this.annotationType = type;
    this.emitChange();
  }

  private emitChange() {
    const textValue = typeof this.value === "string" && this.value.trim();
    const errors = [];

    if (textValue && textValue.length < TEXT_MIN_LIMIT) {
      errors.push("minlength");
    }

    this.data.changed$.next({
      value: {
        prompt: textValue || "",
        annotationType: this.annotationType,
      },
      errors,
      id: this.id,
    });
  }

  private extractInitialValue = () => {
    const { initialValue } = this.data;
    this.value = initialValue?.prompt || "";
    this.annotationType = initialValue?.annotationType || "highlight";
  };

  private onReset = () => {
    this.extractInitialValue();
    this.checkFocus();
    this.changeDetectorRef.markForCheck();
  };

  private checkFocus = () => {
    const { focus } = this.data;
    if (focus) {
      setTimeout(() => {
        this.textarea?.nativeElement?.focus();
      });
    }
  };
}
