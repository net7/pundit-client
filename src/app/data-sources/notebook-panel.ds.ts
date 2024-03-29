import { DataSource, _t } from '@net7/core';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';

export class NotebookPanelDS extends DataSource {
  public labels = {
    current: _t('notebookpanel#current'),
    changeStatus: _t('notebookpanel#changestatus'),
    sharedSoon: _t('notebookpanel#sharedsoon'),
    changeCurrent: _t('notebookpanel#changecurrent'),
    status: _t('notebookpanel#status'),
    statusTypes: {
      public: {
        title: _t('notebookpanel#status_public'),
        description: _t('notebookpanel#status_public_description'),
      },
      private: {
        title: _t('notebookpanel#status_private'),
        description: _t('notebookpanel#status_private_description'),
      },
      shared: {
        title: _t('notebookpanel#status_shared'),
        description: _t('notebookpanel#status_shared_description'),
      },
    },
    shareNotebook: {
      title: _t('notebookpanel#share_title'),
      button: _t('notebookpanel#button_label'),
      description: _t('notebookpanel#share_description'),
    },
    commingSoon: _t('notebookpanel#comingsoon')
  }

  public iconMap = {
    public: '', // no icon
    private: 'lock',
    shared: 'users'
  }

  transform(data) {
    // Data for the internal notebook-selector component
    const notebookSelectorData: NotebookSelectorData = {
      createOption: {
        label: 'New notebook',
        value: 'create'
      },
      notebookList: data.list,
      mode: 'select',
      selectedNotebook: data.selected
    };
    return {
      ...data,
      _meta: { notebookSelectorData },
      icons: this.iconMap,
      labels: this.labels,
    };
  }

  /**
   * Toggles the loading state for the notebook panel component.
   * @param loading boolean
   */
  changeLoadingState(loading: boolean) {
    this.output.isLoading = loading;
  }

  /**
   * Toggles the notebook selector component loading state.
   * @param loading boolean
   */
  changeNotebookSelectorLoadingState(loading: boolean) {
    this.output._meta.notebookSelectorData.isLoading = loading;
  }
}
