import { DataSource, _t } from '@n7-frontend/core';
import { Tag } from '@pundit/communication';
import Tagify from '@yaireo/tagify';
import { CommentModalData } from '../components/comment-modal/comment-modal';
import { NotebookData } from '../services/notebook.service';

const TEXT_MIN_LIMIT = 3;

interface CommentModalInput {
  comment: {
    visible: boolean;
    value: string;
  };
  tags: {
    values: Tag[];
    visible: boolean;
  };
  currentNotebook: NotebookData;
  notebooks: NotebookData[];
  textQuote: string;
  update: boolean;
}

export class CommentModalDS extends DataSource {
  private instance;

  private defaultPosition: { x: number; y: number };

  private tagFormInstance;

  private tagFormRef;

  transform(data: CommentModalInput): CommentModalData {
    const {
      currentNotebook, notebooks, textQuote, comment, tags, update
    } = data;

    const showComment = data.comment.visible;
    const showTagsOnly = !showComment && data.tags.visible;

    // textarea focus
    if (data.comment.visible) {
      this.initTextArea(comment.value);
    }

    if (this.tagFormInstance) {
      if (showTagsOnly) {
        this.focusTagForm();
      }
      this.updateTagFormIstance(data?.tags?.values);
    }

    const saveButtonLabel = showTagsOnly ? _t('commentmodal#save_tags') : _t('commentmodal#save');

    return {
      textQuote,
      visible: true,
      update: !!update,
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
          label: saveButtonLabel,
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
      },
      _setupTagForm: (reference, initialTags?) => {
        this.tagFormRef = reference;
        const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
        const sidebarRef = shadowRoot.querySelector('.pnd-sidebar');
        const tagFormConfig = {
          pattern: /^\w{2,128}$/,
          delimiters: ',| ',
          maxTags: 20,
          transformTag: this.transformTag,
          backspace: 'edit',
          placeholder: 'Add a tag',
          dropdown: {
            enabled: 0,
            fuzzySearch: false,
            position: 'all',
            caseSensitive: true,
            appendTarget: sidebarRef
          }
        };

        this.tagFormInstance = new Tagify(reference, tagFormConfig);
        if (Array.isArray(initialTags)) {
          this.tagFormInstance.addTags(initialTags);
        }
        return this.tagFormInstance;
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

  private focusTagForm() {
    if (this.tagFormRef) {
      const input = this.tagFormRef as HTMLInputElement;
      input.focus();
    }
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
    const isUpdate = this.output.update;
    const textLength = (typeof text === 'string' && text.trim())
      ? text.length
      : 0;
    if (!isUpdate) {
      this.updateSaveButtonState(textLength < TEXT_MIN_LIMIT);
    } else {
      this.updateSaveButtonState(textLength > 0 && textLength < TEXT_MIN_LIMIT);
    }
  }

  public onTagsChange(payload) {
    const isUpdate = this.output.update;
    const isShowingOnlyTagsForm = !this.output.form.comment.visible
      && this.output.form.tags.visible;
    if (isShowingOnlyTagsForm) {
      if (!isUpdate) {
        this.updateSaveButtonState((!Array.isArray(payload) || payload.length === 0));
      } else {
        this.updateSaveButtonState(false);
      }
    }
  }

  public isVisible = () => this.output?.visible;

  changeNotebookSelectorLoadingState(loading: boolean) {
    this.output.form.notebookSelectorData.isLoading = loading;
  }

  private updateTagFormIstance(values: string[]) {
    this.tagFormInstance.removeAllTags();
    if (Array.isArray(values)) {
      this.tagFormInstance.addTags(values);
    }
  }

  // generate a random color (in HSL format, which I like to use)
  private getRandomColor = () => {
    const rand = (min, max) => min + Math.random() * (max - min);

    const h = Math.trunc(rand(1, 360));
    const s = Math.trunc(rand(40, 70));
    const l = Math.trunc(rand(65, 72));

    return `hsl(${h},${s}%,${l}%)`;
  }

  private transformTag = (tagData) => {
    tagData.style = `--tag-bg:${this.getRandomColor()}`;
  }
}
