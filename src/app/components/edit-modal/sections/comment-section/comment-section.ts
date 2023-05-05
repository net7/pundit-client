import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TextEditorData } from 'src/app/components/text-editor/text-editor';
import { FormSection, FormSectionData } from 'src/app/types';
import { editor } from '../../../text-editor/editor/editor';

const TEXT_MIN_LIMIT = 3;

export type CommentSectionValue = string;

export type CommentSectionOptions = {
  label: string;
};

@Component({
  selector: 'pnd-comment-section',
  templateUrl: './comment-section.html'
})
export class CommentSectionComponent implements AfterViewInit, OnDestroy, FormSection<
  CommentSectionValue, CommentSectionOptions
> {
  id = 'comment';

  editor: any;

  @Input() public data: FormSectionData<CommentSectionValue, CommentSectionOptions>;

  @Input() public reset$: Subject<void>;

  public editorData: TextEditorData;

  private destroy$: Subject<void> = new Subject();

  ngAfterViewInit() {
    this.init();
    this.checkFocus();
    this.reset$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(this.onReset);
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  init() {
    setTimeout(() => {
      const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
      const appendTo: HTMLElement = shadowRoot.querySelector('.pnd-text-editor__view');
      const target: HTMLElement = shadowRoot.querySelector('.pnd-text-editor__content');

      editor.init({
        target,
        appendTo,
        onChange: this.onChange.bind(this)
      });

      // editor data
      this.editorData = {
        content: this.data.initialValue || '',
        menu: editor.getMenu()
      };
    });
  }

  onChange({ text, html }) {
    // check for errors
    const textValue = (typeof text === 'string' && text.trim());
    const errors = [];
    if (textValue && textValue.length < TEXT_MIN_LIMIT) {
      errors.push('minlength');
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
      editor.setContent(initialValue);
      this.checkFocus();
    });
  }

  private checkFocus = () => {
    const { focus } = this.data;
    if (focus) {
      setTimeout(() => {
        editor.focus();
      });
    }
  }
}
