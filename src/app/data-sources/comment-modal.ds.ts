import { DataSource, _t } from '@n7-frontend/core';
import { CommentModalData } from '../components/comment-modal/comment-modal';

export class CommentModalDS extends DataSource {
  transform(data): CommentModalData {
    const { currentNotebook, notebooks } = data;
    return {
      visible: true,
      header: {
        label: _t('commentmodal#label'),
      },
      form: {
        comment: {
          value: null
        },
        notebooks: {
          label: _t('commentmodal#notebook'),
          select: {
            header: {
              label: currentNotebook.label,
              icon: {
                id: 'n7-icon-caret-down',
              },
              payload: {
                source: 'notebooks-header'
              }
            },
            items: notebooks
              .filter(({ id: itemId }) => itemId !== currentNotebook.id)
              .map(({ id: itemId, label }) => ({
                label,
                payload: {
                  notebookId: itemId,
                  source: 'notebook-item'
                }
              })),
          },
        },
        actions: [{
          label: _t('commentmodal#cancel'),
          payload: {
            source: 'action-cancel'
          }
        }, {
          label: _t('commentmodal#save'),
          payload: {
            source: 'action-save'
          }
        }],
      },
    };
  }

  public close() {
    this.output.visible = false;
  }

  public notebooksToggle() {
    const { classes } = this.output.notebooks;
    this.output.notebooks.classes = classes ? null : 'is-open';
  }
}
