import { DataSource, _t } from '@n7-frontend/core';
import { CommentModalData } from '../components/comment-modal/comment-modal';
import { NotebookData } from '../services/notebook.service';

const TEXT_MIN_LIMIT = 3;

interface CommentModalInput {
  comment: string | undefined;
  currentNotebook: NotebookData;
  notebooks: NotebookData[];
  textQuote: string;
}

export class CommentModalDS extends DataSource {
  private instance;

  private defaultPosition: { x: number; y: number };

  transform(data: CommentModalInput): CommentModalData {
    const {
      currentNotebook, notebooks, textQuote, comment
    } = data;

    // textarea focus
    this.focusTextarea();

    return {
      textQuote,
      visible: true,
      header: {
        label: _t('commentmodal#label'),
      },
      form: {
        comment: {
          value: comment || null
        },
        notebookSelectorData: {
          selectedNotebook: currentNotebook,
          notebookList: notebooks,
          mode: 'select',
          createOption: {
            label: 'Create new notebook',
            value: 'create'
          }
        },
        // notebooks: {
        //   label: _t('commentmodal#notebook'),
        //   select: {
        //     header: {
        //       label: currentNotebook.label,
        //       icon: {
        //         id: 'pundit-icon-angle-down',
        //       },
        //       payload: {
        //         source: 'notebooks-header'
        //       }
        //     },
        //     items: notebooks
        //       .map(({ id: itemId, label }) => ({
        //         label,
        //         id: itemId
        //       })),
        //   },
        // },
        actions: [{
          label: _t('commentmodal#cancel'),
          payload: {
            source: 'action-cancel'
          }
        }, {
          label: _t('commentmodal#save'),
          classes: 'pnd-btn-cta',
          disabled: true,
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

  private focusTextarea() {
    setTimeout(() => {
      const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
      const textarea = shadowRoot.querySelector('.pnd-comment-modal textarea') as HTMLElement;
      if (textarea) {
        textarea.focus();
      }
    });
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

  public onTextChange(text) {
    const { actions } = this.output.form;
    const textLength = (typeof text === 'string' && text.trim())
      ? text.length
      : 0;

    // update save button disabled state
    setTimeout(() => {
      actions[1].disabled = textLength < TEXT_MIN_LIMIT;
    });
  }

  public isVisible = () => this.output?.visible;
}
