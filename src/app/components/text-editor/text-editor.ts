import { AfterViewInit, Component, Input } from '@angular/core';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { DOMParser } from 'prosemirror-model';
import { Subject } from 'rxjs';
import textEditorConfig from './text-editor.config';
import getDefaultPlugins from './plugins';

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

  private editorView;

  public menuEvent$: Subject<{
    type: string;
    payload: any;
  }> = new Subject();

  public config = textEditorConfig;

  ngAfterViewInit() {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const editorEl: HTMLElement = shadowRoot.querySelector('.pnd-text-editor__view');
    const contentEl: HTMLElement = shadowRoot.querySelector('.pnd-text-editor__content');

    const plugins = getDefaultPlugins(this.config.editorSchema);

    this.editorView = new EditorView(editorEl, {
      state: EditorState.create({
        plugins,
        doc: DOMParser.fromSchema(this.config.editorSchema).parse(contentEl),
      })
    });

    // listen menu events
    this.listenMenu();
  }

  private listenMenu() {
    this.menuEvent$.subscribe(({ type, payload }) => {
      if (type === 'click') {
        payload.command(this.editorView.state, this.editorView.dispatch, this.editorView);
      }
    });
  }
}
