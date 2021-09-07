import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { toggleMark } from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';
import { Subject } from 'rxjs';
import { _t } from '@n7-frontend/core';
import getDefaultPlugins from './plugins';
import editorConfig from './editor.config';
import { TextEditorMenuButton, TextEditorMenuData } from '../sections/text-editor-menu/text-editor-menu';
import { isLinkActive, isNodeActive } from './helpers';

class Editor {
  private editorView;

  private schema;

  private menu: TextEditorMenuData;

  public menuEvent$: Subject<{
    type: string;
    payload: any;
  }> = new Subject();

  public init(
    { target, appendTo, onChange }:
    {
      target: HTMLElement;
      appendTo: HTMLElement;
      onChange: (content: object) => void;
    }
  ) {
    // menu
    this.loadMenu();

    // schema
    this.loadSchema();

    // plugins
    const plugins = getDefaultPlugins(this.schema);

    // view
    this.editorView = new EditorView(appendTo, {
      state: EditorState.create({
        plugins,
        doc: DOMParser.fromSchema(this.schema).parse(target),
      }),
      dispatchTransaction: (transaction) => {
        const newState = this.editorView.state.apply(transaction);
        this.editorView.updateState(newState);
        this.updateMenuState();

        // send changes
        onChange(this.getContent());
      }
    });

    // listen
    this.listen();
  }

  public focus() {
    if (this.editorView) {
      this.editorView.focus();
    }
  }

  public getMenu = () => this.menu;

  // source: https://github.com/PierBover/prosemirror-cookbook
  public getContent() {
    const { state } = this.editorView;
    const fragment = DOMSerializer.fromSchema(state.schema).serializeFragment(state.doc.content);
    const div = document.createElement('div');
    div.appendChild(fragment);
    return {
      html: div.innerHTML,
      text: div.innerText
    };
  }

  // source: https://github.com/sibiraj-s/ngx-editor
  public setContent(html: string) {
    const { state } = this.editorView;
    const { tr, doc, schema } = state;

    const el = document.createElement('div');
    el.innerHTML = html;
    const docJson = DOMParser.fromSchema(schema).parse(el).toJSON();
    const newDoc = schema.nodeFromJSON(docJson);

    tr.replaceWith(0, state.doc.content.size, newDoc);

    // don't emit if both content is same
    if (doc.eq(tr.doc)) {
      return;
    }

    if (!tr.docChanged) {
      return;
    }

    this.editorView.dispatch(tr);
  }

  private loadMenu() {
    const { buttons, labels, commands } = editorConfig.menu;
    this.menu = {
      linkForm: {
        actions: {
          save: {
            label: _t('texteditor#link_save'),
            disabled: true
          },
          cancel: {
            label: _t('texteditor#link_cancel'),
          },
        },
        label: _t('texteditor#link_label'),
        placeholder: _t('texteditor#link_placeholder'),
      },
      groups: buttons.map((group) => ({
        buttons: group.map((button) => ({
          id: button,
          type: '',
          title: _t(labels[button]),
          command: commands[button],
          disabled: true
        }))
      })),
      menuEvent$: this.menuEvent$
    };
  }

  private loadSchema() {
    this.schema = editorConfig.schema;
  }

  private listen() {
    this.menuEvent$.subscribe(({ type, payload }) => {
      switch (type) {
        case 'click':
          this.handleClick(payload);
          break;
        case 'linkinput':
          this.handleLinkInput(payload);
          break;
        case 'linkcancel':
          this.handleLinkCancel();
          break;
        case 'linksave':
          this.handleLinkSave();
          break;
        default:
          break;
      }
    });
  }

  private handleClick(button: TextEditorMenuButton) {
    // focus editor view
    // to view current selection
    this.editorView.focus();

    if (button.id === 'link') {
      const { state, dispatch } = this.editorView;
      if (isLinkActive(state)) {
        const markType = this.schema.marks.link;
        toggleMark(markType)(state, dispatch);
      } else {
        const { linkForm } = this.menu;
        linkForm.visible = !linkForm.visible;
      }
    } else {
      const { state, dispatch } = this.editorView;
      button.command(state, dispatch);
    }
  }

  private handleLinkSave() {
    const { state, dispatch } = this.editorView;
    const { linkForm } = this.menu;
    const markType = this.schema.marks.link;
    const attrs = {
      href: linkForm.inputValue
    };
    toggleMark(markType, attrs)(state, dispatch);

    // close & reset
    this.handleLinkCancel();
  }

  private handleLinkInput(value: string) {
    const { linkForm } = this.menu;
    const newValue = value ? value.trim() : value;
    linkForm.inputValue = newValue;

    // update disabled
    linkForm.actions.save.disabled = !value;
  }

  private handleLinkCancel() {
    const { linkForm } = this.menu;
    // reset
    linkForm.visible = false;
    linkForm.inputValue = null;
  }

  private updateMenuState() {
    const markCodes = this.getActiveMarkCodes();
    const markAvail = this.getAvailableMarkCodes();
    this.menu.groups.forEach((group) => {
      group.buttons.forEach((button) => {
        button.active = markCodes.includes(button.id);
        button.disabled = !markAvail.includes(button.id);

        // list check
        if (['ul', 'ol'].includes(button.id)) {
          const { schema } = this.editorView.state;
          const type = button.id === 'ol'
            ? schema.nodes.ordered_list
            : schema.nodes.bullet_list;
          button.active = this.isListActive(type);
          button.disabled = button.active ? false : !this.isListAvailable(type);
        }
      });
    });
  }

  // source: https://github.com/PierBover/prosemirror-cookbook
  private getActiveMarkCodes() {
    const isEmpty = this.editorView.state.selection.empty;
    const { state } = this.editorView;

    if (isEmpty) {
      const { $from } = this.editorView.state.selection;
      const { storedMarks } = state;

      // Return either the stored marks, or the marks at the cursor position.
      // Stored marks are the marks that are going to be applied to the next input
      // if you dispatched a mark toggle with an empty cursor.
      if (storedMarks) {
        return storedMarks.map((mark) => mark.type.name);
      }
      return $from.marks().map((mark) => mark.type.name);
    }
    const { $head } = this.editorView.state.selection;
    const { $anchor } = this.editorView.state.selection;

    // We're using a Set to not get duplicate values
    const activeMarks = new Set();

    // Here we're getting the marks at the head and anchor of the selection
    $head.marks().forEach((mark) => activeMarks.add(mark.type.name));
    $anchor.marks().forEach((mark) => activeMarks.add(mark.type.name));

    return Array.from(activeMarks);
  }

  // source: https://github.com/PierBover/prosemirror-cookbook
  private getAvailableMarkCodes() {
    const markTypes = this.editorView.state.schema.marks;

    return Object.keys(markTypes).filter((key) => {
      const mark = markTypes[key];
      return toggleMark(mark)(this.editorView.state, null, this.editorView);
    });
  }

  private isListAvailable(type) {
    const { state } = this.editorView;
    return wrapInList(type)(state);
  }

  private isListActive(type) {
    const { state } = this.editorView;
    return isNodeActive(state, type);
  }
}

// exports
export const editor = new Editor();
