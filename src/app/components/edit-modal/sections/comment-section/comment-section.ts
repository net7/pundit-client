import {
  Component,
  Input,
} from '@angular/core';
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
export class CommentSectionComponent implements FormSection<
  CommentSectionValue, CommentSectionOptions
> {
  id = 'comment';

  @Input() public data: FormSectionData<CommentSectionValue, CommentSectionOptions>;

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
}
