import { EditorState } from 'prosemirror-state';
import {
  MarkType, Mark, NodeType, ResolvedPos
} from 'prosemirror-model';

// source project: https://github.com/sibiraj-s/ngx-editor
// source file: https://github.com/sibiraj-s/ngx-editor/blob/master/projects/ngx-editor/helpers
const findNodeType = (type: NodeType, $from: ResolvedPos): NodeType | null => {
  for (let i = $from.depth; i > 0; i -= 1) {
    if ($from.node(i).type === type) {
      return $from.node(i).type;
    }
  }

  return null;
};

export const isNodeActive = (state: EditorState, type: NodeType, attrs: any = {}): boolean => {
  const { selection } = state;
  const { $from, to } = selection;

  const node: NodeType | null = findNodeType(type, $from);

  if (!Object.entries(attrs).length || !node) {
    return !!node;
  }

  return to <= $from.end() && $from.parent.hasMarkup(type, attrs);
};

export const getSelectionMarks = (state: EditorState): Mark[] => {
  let marks: Mark[] = [];

  const {
    selection: {
      from, to, empty, $from
    }, storedMarks
  } = state;

  if (empty) {
    marks = storedMarks || $from.marks();
  } else {
    state.doc.nodesBetween(from, to, (node) => {
      marks = [...marks, ...node.marks];
    });
  }

  return marks;
};

export const isMarkActive = (state: EditorState, type: MarkType): boolean => {
  const {
    from, $from, to, empty
  } = state.selection;

  if (empty) {
    return !!type.isInSet(state.storedMarks || $from.marks());
  }
  return state.doc.rangeHasMark(from, to, type);
};
