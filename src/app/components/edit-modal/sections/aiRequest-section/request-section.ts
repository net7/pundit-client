import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { TextEditorData } from "src/app/components/text-editor/text-editor";
import { FormSection, FormSectionData } from "src/app/types";
import { editor } from "../../../text-editor/editor/editor";
import { TextEditorComponent } from "../../../text-editor/text-editor";

const TEXT_MIN_LIMIT = 3;

export type AiRequestSectionValue = string | null;

export type AiRequestSectionOptions = {
  label: string;
};

@Component({
  selector: "pnd-ai-request-section",
  templateUrl: "./request-section.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextEditorComponent],
})
export class AiRequestSectionComponent
  implements
    AfterViewInit,
    OnDestroy,
    FormSection<AiRequestSectionValue, AiRequestSectionOptions>
{
  private changeDetectorRef = inject(ChangeDetectorRef);

  id = "aiRequest";

  editor: any;

  @Input() public data!: FormSectionData<
    AiRequestSectionValue,
    AiRequestSectionOptions
  >;

  @Input() public reset$!: Subject<void>;

  public editorData!: TextEditorData;

  private destroy$: Subject<void> = new Subject();

  ngAfterViewInit() {
    this.init();
    this.checkFocus();
    this.reset$.pipe(takeUntil(this.destroy$)).subscribe(this.onReset);
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  init() {
    setTimeout(() => {
      const { shadowRoot } = document.getElementsByTagName("pnd-root")[0];
      const appendTo = shadowRoot!.querySelector(
        ".pnd-text-editor__view",
      ) as HTMLElement;
      const target = shadowRoot!.querySelector(
        ".pnd-text-editor__content",
      ) as HTMLElement;

      editor.init({
        target,
        appendTo,
        onChange: this.onChange.bind(this),
        onRefresh: () => this.changeDetectorRef.markForCheck(),
      });

      // editor data
      this.editorData = {
        content: this.data.initialValue || "",
        menu: editor.getMenu(),
      };
      this.changeDetectorRef.markForCheck();
    });
  }

  onChange({ text, html }: { text: string; html: string }) {
    // check for errors
    const textValue = typeof text === "string" && text.trim();
    const errors = [];
    if (textValue && textValue.length < TEXT_MIN_LIMIT) {
      errors.push("minlength");
    }

    this.data.changed$.next({
      value: textValue ? html : null,
      errors,
      id: this.id,
    });
  }

  private onReset = () => {
    const { initialValue } = this.data;
    setTimeout(() => {
      editor.setContent(initialValue || "");
      this.checkFocus();
      this.changeDetectorRef.markForCheck();
    });
  };

  private checkFocus = () => {
    const { focus } = this.data;
    if (focus) {
      setTimeout(() => {
        editor.focus();
      });
    }
  };
}
