/* eslint-disable @typescript-eslint/camelcase */
import { DOMOutputSpec, Schema } from 'prosemirror-model';
import { toggleMark } from 'prosemirror-commands';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import * as sl from 'prosemirror-schema-list';
import { TextEditorMenuData } from './sections/text-editor-menu/text-editor-menu';
import ListCommand from './list-command';

const buttonsMap = [
  ['bold', 'italic', 'underline', 'strikethrough'],
  ['ul', 'ol'],
  ['link']
];

const labelsMap = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  ul: 'Unordered list',
  ol: 'Ordered list',
  link: 'Add Link'
};

const listItem = {
  ...sl.listItem,
  content: 'paragraph block*'
};

const orderedList = {
  ...sl.orderedList,
  content: 'list_item+',
  group: 'block'
};

const bulletList = {
  ...sl.bulletList,
  content: 'list_item+',
  group: 'block'
};

const customSchema = {
  marks: {
    strike: {
      parseDOM: [
        { tag: 's' },
        { tag: 'strike' },
        {
          style: 'text-decoration=line-through',
          consuming: false
        }
      ],
      toDOM() { return ['s', 0]; }
    },
    underline: {
      parseDOM: [
        { tag: 'u' },
        {
          style: 'text-decoration=underline',
          consuming: false
        }
      ],
      toDOM() { return ['u', 0]; }
    },
    code: {
      parseDOM: [{ tag: 'code' }],
      toDOM() { return ['code', 0]; }
    },
    link: {
      attrs: {
        href: {},
        title: { default: null },
        target: { default: '_blank' },
      },
      inclusive: false,
      parseDOM: [{
        tag: 'a[href]',
        getAttrs(dom: HTMLElement): Record<string, any> {
          return {
            href: dom.getAttribute('href'),
            title: dom.getAttribute('title'),
            target: dom.getAttribute('target')
          };
        }
      }],
      toDOM(node): DOMOutputSpec {
        const { href, title, target } = node.attrs;
        return ['a', { href, title, target }, 0];
      }
    },
  },
  nodes: {
    list_item: listItem,
    ordered_list: orderedList,
    bullet_list: bulletList
  }
};

const marks = baseSchema.spec.marks.append(customSchema.marks);
const nodes = baseSchema.spec.nodes.append(customSchema.nodes);

const editorSchema = new Schema({
  nodes,
  marks,
});

const ulCommand = new ListCommand(true);
const olCommand = new ListCommand(false);

const commandMap = {
  bold: toggleMark(editorSchema.marks.strong),
  italic: toggleMark(editorSchema.marks.em),
  underline: toggleMark(editorSchema.marks.underline),
  strikethrough: toggleMark(editorSchema.marks.strike),
  ul: ulCommand.toggle(),
  ol: olCommand.toggle(),
  // TODO: completare commands
  link: toggleMark(editorSchema.marks.strong),
};

export default {
  editorSchema,
  menu: {
    groups: buttonsMap.map((group) => ({
      buttons: group.map((button) => ({
        id: button,
        type: '',
        title: labelsMap[button],
        command: commandMap[button]
      }))
    }))
  } as TextEditorMenuData
};
