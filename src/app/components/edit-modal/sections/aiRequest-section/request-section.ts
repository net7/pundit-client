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

export type AiRequestSectionValue = string | null;

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

  @Output() public generate = new EventEmitter<string>();

  public value = "";

  private destroy$: Subject<void> = new Subject();

  ngAfterViewInit() {
    this.value = this.data.initialValue || "";
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

    const textValue = typeof value === "string" && value.trim();
    const errors = [];

    if (textValue && textValue.length < TEXT_MIN_LIMIT) {
      errors.push("minlength");
    }

    this.data.changed$.next({
      value: textValue || null,
      errors,
      id: this.id,
    });
  }

  onGenerate() {
    const textValue = typeof this.value === "string" && this.value.trim();
    if (textValue && textValue.length >= TEXT_MIN_LIMIT) {
      this.generate.emit(textValue);
    }
  }

  private onReset = () => {
    const { initialValue } = this.data;
    this.value = initialValue || "";
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
