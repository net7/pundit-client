import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Interface for TextEditorMenu's "data"
 */
export interface TextEditorMenuData {
  groups: TextEditorMenuGroup[];
  linkForm: {
    actions: {
      save: {
        label: string;
        disabled: boolean;
      };
      cancel: {
        label: string;
      };
    };
    inputValue?: string;
    label?: string;
    placeholder?: string;
    visible?: boolean;
  };
  menuEvent$: Subject<{
    type: string;
    payload?: any;
  }>;
  classes?: string;
}

export interface TextEditorMenuGroup {
  buttons: TextEditorMenuButton[];
}

export interface TextEditorMenuButton {
  id: string;
  command: (state: any, dispatch: any) => any;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  classes?: boolean;
}

@Component({
  selector: 'pnd-text-editor-menu',
  templateUrl: './text-editor-menu.html'
})
export class TextEditorMenuComponent {
  @Input() public data: TextEditorMenuData;

  onClick(button: TextEditorMenuButton) {
    this.data.menuEvent$.next({
      type: 'click',
      payload: button
    });
  }

  onLinkKeyup(ev: KeyboardEvent) {
    if (ev.key === 'Enter') {
      this.onLinkSave();
    }
  }

  onLinkInput(payload: string) {
    this.data.menuEvent$.next({
      payload,
      type: 'linkinput',
    });
  }

  onLinkSave() {
    this.data.menuEvent$.next({
      type: 'linksave'
    });
  }

  onLinkCancel() {
    this.data.menuEvent$.next({
      type: 'linkcancel'
    });
  }
}
