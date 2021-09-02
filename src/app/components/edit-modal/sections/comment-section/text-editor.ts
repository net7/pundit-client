import { Plugin, EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { toggleMark, baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';

class MenuView {
  public dom: HTMLElement;

  constructor(
    public items,
    public editorView
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'menubar';
    this.addItems();
    this.listen();
  }

  destroy() {
    this.dom.remove();
  }

  private addItems() {
    this.items.forEach(({ dom }) => {
      this.dom.appendChild(dom);
    });
    this.update();
  }

  private listen() {
    this.dom.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      this.editorView.focus();
      this.items.forEach(({ command, dom }) => {
        if (dom.contains(ev.target)) {
          command(this.editorView.state, this.editorView.dispatch, this.editorView);
        }
      });
    });
  }

  private update() {
    this.items.forEach(({ command, dom }) => {
      const active = command(this.editorView.state, null, this.editorView);
      dom.style.display = active ? '' : 'none';
    });
  }
}

function menuPuglin(items) {
  return new Plugin({
    view(editorView) {
      const menuView = new MenuView(items, editorView);
      editorView.dom.parentNode.insertBefore(menuView.dom, editorView.dom);
      return menuView;
    }
  });
}

function icon(text, name) {
  const span = document.createElement('span');
  span.className = `menuicon menuicon-${name}`;
  span.title = name;
  span.textContent = text;
  return span;
}

const customSchema = {
  link: {
    attrs: {
      href: {},
      title: { default: null },
      target: { default: '_self' },
    },
    inclusive: false,
    parseDOM: [{
      tag: 'a[href]',
      getAttrs(dom) {
        return {
          href: dom.getAttribute('href'),
          title: dom.getAttribute('title'),
          target: dom.getAttribute('target')
        };
      }
    }],
    toDOM(node) { const { href, title, target } = node.attrs; return ['a', { href, title, target }, 0]; }
  }
};

const menu = menuPuglin([
  { command: toggleMark(schema.marks.strong), dom: icon('B', 'strong') },
  { command: toggleMark(schema.marks.em), dom: icon('i', 'em') },
  { command: toggleMark(schema.marks.code), dom: icon('code', 'code') },
  { command: toggleMark(customSchema.link), dom: icon('link', 'a') }
]);

export const load = (editorEl: HTMLElement, contentEl: HTMLElement) => new EditorView(editorEl, {
  state: EditorState.create({
    doc: DOMParser.fromSchema(schema).parse(contentEl),
    plugins: [keymap(baseKeymap), menu]
  })
});
