import {
  AfterViewInit,
  Component,
  Input,
} from '@angular/core';
import { Subject } from 'rxjs';
import { FormSection, FormSectionData } from 'src/app/types';

const TEXT_MIN_LIMIT = 3;

export type CommentSectionValue = string;

export type CommentSectionOptions = {
  label: string;
};

@Component({
  selector: 'pnd-comment-section',
  templateUrl: './comment-section.html'
})
export class CommentSectionComponent implements AfterViewInit, FormSection<
  CommentSectionValue, CommentSectionOptions
> {
  id = 'comment';

  @Input() public data: FormSectionData<CommentSectionValue, CommentSectionOptions>;

  @Input() public reset$: Subject<void>;

  ngAfterViewInit() {
    this.checkFocus();
    this.reset$.subscribe(this.onReset);
  }

  onChange(payload) {
    // check for errors
    const value = (typeof payload === 'string' && payload.trim());
    const errors = [];
    if (value && value.length < TEXT_MIN_LIMIT) {
      errors.push('minlength');
    }

    this.data.changed$.next({
      value,
      errors,
      id: this.id,
    });
  }

  onKeyEvent(ev: KeyboardEvent) {
    ev.stopImmediatePropagation();
    const { key } = ev;
    if (key === 'Tab') {
      // FIXME: passare evento
      // const saveButtonEl = this.saveButton.nativeElement as HTMLButtonElement;
      // if (!saveButtonEl.disabled) {
      //   setTimeout(() => {
      //     saveButtonEl.focus();
      //   });
      // }
    }
  }

  private onReset = () => {
    const { initialValue } = this.data;
    this.getTextAreaEl().value = initialValue;
    this.checkFocus();
  }

  private checkFocus = () => {
    const { focus } = this.data;
    if (focus) {
      const el = this.getTextAreaEl();
      el.focus();
      // focus position end of text
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }

  private getTextAreaEl() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    return shadowRoot.querySelector('textarea.pnd-edit-modal__comment-textarea') as HTMLTextAreaElement;
  }
}
