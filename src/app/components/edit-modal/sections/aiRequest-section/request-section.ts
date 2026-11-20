import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
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
  /**
   * Annotation types offered, in this order; the first is the default when
   * there is no initial value. Absent: all four, highlight first by default.
   */
  annotationTypes?: string[];
};

type AiAnnotationTypeOption = { value: string; label: string };

const DEFAULT_ANNOTATION_TYPE = "highlight";

@Component({
  selector: "pnd-ai-request-section",
  templateUrl: "./request-section.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiRequestSectionComponent
  implements
    OnInit,
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
  public annotationType = DEFAULT_ANNOTATION_TYPE;

  public placeholder = _t("editmodal#ai_placeholder");

  public annotationTypeLabel = _t("editmodal#ai_annotation_type");

  private allAnnotationTypes: AiAnnotationTypeOption[] = [
    { value: "comment", label: _t("editmodal#ai_type_comment") },
    { value: "highlight", label: _t("editmodal#ai_type_highlight") },
    { value: "tags", label: _t("editmodal#ai_type_tags") },
    { value: "semantic_annotation", label: _t("editmodal#ai_type_semantic") },
  ];

  /** The annotation types offered, in order. */
  public annotationTypes: AiAnnotationTypeOption[] = this.allAnnotationTypes;

  private destroy$: Subject<void> = new Subject();

  ngOnInit() {
    // offered types and default ready for the first render
    if (this.data) {
      this.extractInitialValue();
    }
  }

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
    const { initialValue, options } = this.data;
    this.annotationTypes = this.getOfferedTypes(options?.annotationTypes);
    this.value = initialValue?.prompt || "";
    this.annotationType =
      initialValue?.annotationType || this.getDefaultType(options?.annotationTypes);
  };

  /** The types listed in the options, in their order; all of them when none is listed. */
  private getOfferedTypes(values?: string[]): AiAnnotationTypeOption[] {
    const offered = (values ?? [])
      .map((value) => this.allAnnotationTypes.find((type) => type.value === value))
      .filter((type): type is AiAnnotationTypeOption => !!type);
    return offered.length ? offered : this.allAnnotationTypes;
  }

  /** The first offered type when the options list them, highlight otherwise. */
  private getDefaultType(values?: string[]): string {
    return values?.length ? this.annotationTypes[0].value : DEFAULT_ANNOTATION_TYPE;
  }

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
