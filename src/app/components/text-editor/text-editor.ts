import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TextEditorMenuData, TextEditorMenuComponent } from './sections/text-editor-menu/text-editor-menu';

/**
 * Interface for TextEditor's "data"
 */
export interface TextEditorData {
  menu: TextEditorMenuData;
  content?: string;
  classes?: string;
}

@Component({
    selector: 'pnd-text-editor',
    templateUrl: './text-editor.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TextEditorMenuComponent]
})
export class TextEditorComponent {
  @Input() public data!: TextEditorData;
}
