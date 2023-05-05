import { NodeType, Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import {
  toggleMark, baseKeymap
} from 'prosemirror-commands';
import { splitListItem } from 'prosemirror-schema-list';
import { undo, redo } from 'prosemirror-history';
import {
  inputRules, wrappingInputRule,
  smartQuotes, emDash, ellipsis, InputRule
} from 'prosemirror-inputrules';

// source project: https://github.com/sibiraj-s/ngx-editor
// source file: https://github.com/sibiraj-s/ngx-editor/blob/master/projects/ngx-editor/src/lib/defaultPlugins.ts

const isMacOs = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a number
// followed by a dot at the start of a textblock into an ordered list.
const orderedListRule = (nodeType: NodeType): InputRule => wrappingInputRule(
  /^(\d+)\.\s$/,
  nodeType,
  (match) => ({ order: +match[1] }),
  (match, node) => node.childCount + node.attrs.order === +match[1]
);

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textblock into a
// bullet list.
const bulletListRule = (nodeType: NodeType): InputRule => wrappingInputRule(/^\s*([-+*])\s$/, nodeType);

// : (Schema) → Plugin
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
const buildInputRules = (schema: Schema): Plugin => {
  const rules = smartQuotes.concat(ellipsis, emDash);

  rules.push(orderedListRule(schema.nodes.ordered_list));
  rules.push(bulletListRule(schema.nodes.bullet_list));

  return inputRules({ rules });
};

const getKeyboardShortcuts = (schema: Schema) => {
  const historyKeyMap: Record<string, any> = {};

  historyKeyMap['Mod-z'] = undo;
  if (isMacOs) {
    historyKeyMap['Shift-Mod-z'] = redo;
  } else {
    historyKeyMap['Mod-y'] = redo;
  }

  const plugins = [
    keymap({
      'Mod-b': toggleMark(schema.marks.strong),
      'Mod-i': toggleMark(schema.marks.em),
      'Mod-u': toggleMark(schema.marks.u),
      'Mod-`': toggleMark(schema.marks.code),
    }),
    keymap({
      Enter: splitListItem(schema.nodes.list_item),
    }),
    keymap(baseKeymap)
  ];

  plugins.push(keymap(historyKeyMap));

  return plugins;
};

const getDefaultPlugins = (schema: Schema): Plugin[] => {
  const plugins: Plugin[] = [];

  plugins.push(...getKeyboardShortcuts(schema));
  plugins.push(buildInputRules(schema));
  return plugins;
};

export default getDefaultPlugins;
