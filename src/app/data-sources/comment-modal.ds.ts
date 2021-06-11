import { DataSource, _t } from '@n7-frontend/core';
import { Tag } from '@pundit/communication';
import { CommentModalData } from '../components/comment-modal/comment-modal';
import { NotebookData } from '../services/notebook.service';

const TEXT_MIN_LIMIT = 3;

interface CommentModalInput {
  comment: {
    visible: boolean;
    value: string;
  };
  tags: {
    visible: boolean;
    values: Tag[];
  };
  currentNotebook: NotebookData;
  notebooks: NotebookData[];
  textQuote: string;
}

export class CommentModalDS extends DataSource {
  private instance;

  private defaultPosition: { x: number; y: number };

  transform(data: CommentModalInput): CommentModalData {
    const {
      currentNotebook, notebooks, textQuote, comment, tags
    } = data;

    // textarea focus
    this.initTextArea(comment.value);

    return {
      textQuote,
      visible: true,
      header: {
        label: _t('commentmodal#label'),
      },
      form: {
        comment: comment || null,
        tags: tags || null,
        notebookSelectorData: {
          selectedNotebook: currentNotebook,
          notebookList: notebooks,
          mode: 'select',
          createOption: {
            label: 'Create new notebook',
            value: 'create'
          }
        },
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

  private initTextArea(comment: string) {
    setTimeout(() => {
      const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
      const textarea = shadowRoot.querySelector('.pnd-comment-modal textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.value = comment;
        this.onTextChange(textarea.value);
      }
    });
  }

  public updateNotebookSelector({ notebookList, selectedNotebook }) {
    this.output.form.notebookSelectorData.selectedNotebook = selectedNotebook;
    this.output.form.notebookSelectorData.notebookList = notebookList;
    this.output.form.notebookSelectorData._meta = {};
    this.output.form.notebookSelectorData.mode = 'select';
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

  /** Lock or unlock the save button */
  public updateSaveButtonState(isDisabled: boolean) {
    setTimeout(() => {
      this.output.form.actions[1].disabled = isDisabled;
    });
  }

  public onTextChange(text) {
    const textLength = (typeof text === 'string' && text.trim())
      ? text.length
      : 0;
    this.updateSaveButtonState(textLength < TEXT_MIN_LIMIT);
  }

  public isVisible = () => this.output?.visible;

  changeNotebookSelectorLoadingState(loading: boolean) {
    this.output.form.notebookSelectorData.isLoading = loading;
  }
}
