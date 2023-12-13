import { FormControl, Validators } from '@angular/forms';
import { DataSource, _t } from '@net7/core';
import { NotebookShareModalData } from '../components/notebook-share-modal/notebook-share-modal';
import { NotebookData, NotebookUserRole, NotebookUserStatus } from '../services/notebook.service';

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
            roleAsLabel: _t(`notebookshare#role_${role}`),
            statusAsLabel: _t(`notebookshare#status_${status}`),
            dropdown: this.getDropdown(id, role, status)
          }))
        }
      },
      invitationsList: new Map(),
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

  public updateAutocompleteResults({ response, query }) {
    const { autocomplete } = this.output.body.formSection;
    let results = response || [];
    // check email format in query
    if (results.length && this.validateEmail(query)) {
      const email = query.trim();
      results = [{
        email,
        username: null,
        thumb: null,
        hideEmail: true
      }];
    }
    autocomplete.results = results || [];
  }

  public onAutocompleteClick(selected) {
    // clear results
    this.updateAutocompleteResults({ response: null, query: null });

    // update section
    this.output.body.confirmSection = {
      selected,
      text: _t('notebookshare#modal_confirm_text', { username: selected.username || selected.email }),
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
        source: 'action-confirm-ok',
        email: selected.email
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

  private getDropdown(id: string, role: NotebookUserRole, status: NotebookUserStatus) {
    if (role === NotebookUserRole.Owner) return null;
    const dropdown = {
      actions: [],
      isExpanded: false
    };

    let actionKeys = [];
    if (status === NotebookUserStatus.Pending) {
      actionKeys = ['delete_invite', 'resend_invite'];
    } else if (status === NotebookUserStatus.Joined) {
      actionKeys = ['remove'];
    } else if (status === NotebookUserStatus.Removed) {
      actionKeys = ['restore'];
    }
    dropdown.actions = actionKeys.map((action) => ({
      label: _t(`notebookshare#action_${action}`),
      payload: {
        id,
        action
      }
    }));

    return dropdown;
  }

  private validateEmail(email: string) {
    const control = new FormControl(email, Validators.email);
    return !control.errors?.email;
  }
}