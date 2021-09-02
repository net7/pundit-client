import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Interface for TextEditorMenu's "data"
 */
export interface TextEditorMenuData {
  groups: TextEditorMenuGroup[];
  classes?: string;
}

export interface TextEditorMenuGroup {
  buttons: TextEditorMenuButton[];
}

export interface TextEditorMenuButton {
  id: string;
  command: (schema: object) => any;
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

  @Input() public menuEvent$: Subject<{
    type: string;
    payload: any;
  }>;

  onClick(button: TextEditorMenuButton) {
    this.menuEvent$.next({
      type: 'click',
      payload: button
    });
  }
}
