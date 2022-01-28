import { _t } from '@n7-frontend/core';
import { Annotation, AnnotationType } from '@pundit/communication';

export interface ActionButtonConfig {
  id: string;
  type: AnnotationType;
  hasTags?: boolean;
  avoidEdit?: boolean;
}

export const menuNotebookItems = (id, notebooks) => notebooks.map(({ id: itemId, label }) => ({
  label,
  payload: {
    id,
    notebookId: itemId,
    source: 'notebook-item',
  },
}));

export const menuNotebookHeader = (id) => ({
  label: _t('annotation#changenotebook'),
  payload:
    {
      id,
      source: 'notebooks-header'
    }
});

export const menuNotebookSection = (id, currentUserNotebooks) => {
  const header = menuNotebookHeader(id);
  const items = menuNotebookItems(id, currentUserNotebooks);
  return {
    header,
    items,
  };
};

// TODO REMOVE AFTER SEMANTIC ANNOTATION IMPLEMENTATION
export const blockEditAction = (annotation: Annotation): boolean => {
  if (annotation.type !== 'Linking') {
    return false;
  }
  const triples = annotation.content;
  const hasObjectUri = triples.find(
    (t) => t.objectType === 'uri' && t.object.source === 'search'
  );
  const hasDate = triples.find((t) => t.objectType === 'date');
  return !!hasObjectUri || !!hasDate;
};

export const menuIconButton = (id) => ({
  id: 'ellipsis-v',
  payload: {
    id,
    source: 'menu-header',
  },
});

const getActionButton = (
  id: string,
  type: 'comment' | 'tags' | 'semantic',
  action: 'add' | 'edit'
) => ({
  label: _t(`annotation#${action}${type}`),
  payload: {
    id,
    source: `action-${type}`,
  },
});

export const menuActionButtons = (config: ActionButtonConfig) => {
  const { id, type } = config;
  const actions = [
    {
      label: _t('annotation#changenotebook'),
      payload: {
        id,
        source: 'action-notebooks',
      },
    },
  ];
  // TODO REMOVE AFTER SEMANTIC MODAL IMPLEMENTATION
  if (!config?.avoidEdit) {
    if (type === 'Commenting') {
      actions.push(getActionButton(id, 'comment', 'edit'));
    } else if (type === 'Linking') {
      actions.push(getActionButton(id, 'semantic', 'edit'));
    } else if (type === 'Highlighting') {
      const tagOptions = config?.hasTags ? 'edit' : 'add';
      actions.push(getActionButton(id, 'comment', 'add'));
      actions.push(getActionButton(id, 'semantic', 'add'));
      actions.push(getActionButton(id, 'tags', tagOptions));
    }
  }
  // and delete action
  actions.push({
    label: _t('annotation#delete'),
    payload: {
      id,
      source: 'action-delete',
    },
  });
  return actions;
};
