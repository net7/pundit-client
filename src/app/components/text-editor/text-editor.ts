import { AfterViewInit, Component, Input } from '@angular/core';
import { editor } from './editor/editor';
import { TextEditorMenuData } from './sections/text-editor-menu/text-editor-menu';

/**
 * Interface for TextEditor's "data"
 */
export interface TextEditorData {
  content?: string;
  classes?: string;
}

@Component({
  selector: 'pnd-text-editor',
  templateUrl: './text-editor.html'
})
export class TextEditorComponent implements AfterViewInit {
  @Input() public data: TextEditorData;

  public menuData: TextEditorMenuData;

  ngAfterViewInit() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const editorEl: HTMLElement = shadowRoot.querySelector('.pnd-text-editor__view');
    const contentEl: HTMLElement = shadowRoot.querySelector('.pnd-text-editor__content');

    editor.init(contentEl, editorEl);

    // get menu data
    this.menuData = editor.getMenu();
  }
}
