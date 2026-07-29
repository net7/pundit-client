import {
  AfterViewInit,
  Component,
  Input,
  Output,
  OnDestroy,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  inject,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { FormSection, FormSectionData } from "src/app/types";

const TEXT_MIN_LIMIT = 3;

export type AiRequestSectionObjectValue = {
  prompt: string;
  annotationType: string;
};

export type AiRequestSectionValue = AiRequestSectionObjectValue | string | null;

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

  @Input() public aiPreviewActive = false;

  @Output() public generate = new EventEmitter<
    { prompt: string; annotationType: string } | string
  >();

  public value = "";
  public annotationType = "highlight";

  public annotationTypes = [
    { value: "comment", label: "Comment" },
    { value: "highlight", label: "Highlight" },
    { value: "tags", label: "Tag" },
    { value: "semantic_annotation", label: "Semantic" },
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

  onGenerate() {
    const textValue = typeof this.value === "string" && this.value.trim();
    if (textValue && textValue.length >= TEXT_MIN_LIMIT) {
      this.generate.emit({
        prompt: textValue,
        annotationType: this.annotationType,
      });
    }
  }

  private extractInitialValue = () => {
    const { initialValue } = this.data;
    if (typeof initialValue === "object" && initialValue !== null) {
      this.value = initialValue.prompt || "";
      this.annotationType = initialValue.annotationType || "highlight";
    } else {
      this.value = (initialValue as string) || "";
      this.annotationType = "highlight";
    }
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
