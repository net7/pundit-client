import { DataSource, _t } from '@n7-frontend/core';
import { CommentModalData } from '../components/comment-modal/comment-modal';

export class CommentModalDS extends DataSource {
  private instance;

  private defaultPosition: { x: number; y: number };

  transform(data): CommentModalData {
    const { currentNotebook, notebooks, selected } = data;
    return {
      selectedText: selected,
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
                id: 'pundit-icon-angle-down',
              },
              payload: {
                source: 'notebooks-header'
              }
            },
            items: notebooks
              .map(({ id: itemId, label }) => ({
                label,
                id: itemId
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
          classes: 'pnd-btn-cta',
          payload: {
            source: 'action-save'
          }
        }],
      },
      _setInstance: (instance) => {
        this.instance = instance;
        const { x, y } = this.instance.get();
        this.defaultPosition = { x, y };
      }
    };
  }

  public close() {
    this.output.visible = false;
    const { x, y } = this.defaultPosition;
    this.instance.set(x, y);
  }

  public notebooksToggle() {
    const { select } = this.output.form.notebooks;
    const { classes } = select;
    select.classes = classes ? null : 'is-open';
  }
}
