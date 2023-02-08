import { DataSource, _t } from '@net7/core';
import { NotebookShareModalData } from '../components/notebook-share-modal/notebook-share-modal';
import { NotebookData } from '../services/notebook.service';

export class NotebookShareModalDS extends DataSource {
  transform(data: NotebookData): NotebookShareModalData {
    return {
      visible: true,
      header: {
        label: _t('notebookshare#modal_title', { label: data.label }),
      },
      body: {
        formSection: {
          text: _t('notebookshare#modal_text'),
          autocomplete: {
            input: {
              placeholder: _t('notebookshare#modal_input_placeholder')
            }
          }
        },
        listSection: {
          title: _t('notebookshare#list_title'),
          items: (data.users || []).map(({
            id, username, thumb, role, status
          }) => ({
            id,
            username,
            thumb,
            role,
            status,
            roleAsLabel: _t(`notebookshare#role_${role}`)
          }))
        }
      },
      actions: this.getFormActions(),
    };
  }

  public close() {
    this.output.visible = false;
  }

  public open() {
    this.output.visible = true;
  }

  public isVisible = () => this.output?.visible;

  public closeConfirm() {
    this.output.body.confirmSection = null;

    // update actions
    this.output.actions = this.getFormActions();
  }

  public updateAutocompleteResults(payload) {
    const { autocomplete } = this.output.body.formSection;
    autocomplete.results = payload || [];
  }

  public onAutocompleteClick(selected) {
    // clear results
    this.updateAutocompleteResults(null);

    // update section
    this.output.body.confirmSection = {
      selected,
      text: _t('notebookshare#modal_confirm_text', { username: selected.username }),
    };

    // update actions
    this.output.actions = [{
      label: _t('notebookshare#modal_cancel'),
      payload: {
        source: 'action-confirm-cancel'
      }
    }, {
      label: _t('notebookshare#modal_confirm_ok'),
      classes: 'pnd-btn-cta',
      payload: {
        source: 'action-confirm-ok'
      }
    }];
  }

  private getFormActions() {
    return [{
      label: _t('notebookshare#modal_cancel'),
      payload: {
        source: 'action-cancel'
      }
    }, {
      label: _t('notebookshare#modal_ok'),
      classes: 'pnd-btn-cta',
      payload: {
        source: 'action-ok'
      }
    }];
  }
}
