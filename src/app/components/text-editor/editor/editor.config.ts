/* eslint-disable @typescript-eslint/camelcase */
import { DOMOutputSpec, Schema } from 'prosemirror-model';
import { toggleMark } from 'prosemirror-commands';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import * as sl from 'prosemirror-schema-list';
import ListCommand from './list-command';

const buttons = [
  ['strong', 'em', 'underline', 'strike', 'code'],
  ['ul', 'ol'],
  ['link']
];

const labels = {
  strong: 'texteditor#bold',
  em: 'texteditor#italic',
  underline: 'texteditor#underline',
  strike: 'texteditor#strikethrough',
  code: 'texteditor#code',
  ul: 'texteditor#ul',
  ol: 'texteditor#ol',
  link: 'texteditor#link'
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
            target: '_blank' // force _blank
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
let nodes = baseSchema.spec.nodes.append(customSchema.nodes);

// clean up unused
const unusedNodeTypes = [
  'blockquote',
  'horizontal_rule',
  'heading',
  'code_block',
  'image'
];
unusedNodeTypes.forEach((key) => {
  nodes = nodes.remove(key);
});

const schema = new Schema({
  nodes,
  marks,
});

const ulCommand = new ListCommand(true);
const olCommand = new ListCommand(false);

const commands = {
  strong: toggleMark(schema.marks.strong),
  em: toggleMark(schema.marks.em),
  underline: toggleMark(schema.marks.underline),
  strike: toggleMark(schema.marks.strike),
  code: toggleMark(schema.marks.code),
  ul: ulCommand.toggle(),
  ol: olCommand.toggle(),
  link: null, // command manually triggered
};

export default {
  schema,
  menu: { buttons, labels, commands }
};
