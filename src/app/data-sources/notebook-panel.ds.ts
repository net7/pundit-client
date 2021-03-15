import { DataSource, _t } from '@n7-frontend/core';
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
    commingSoon: _t('notebookpanel#commingsoon')
  }

  public iconMap = {
    public: '',
    private: 'pundit-icon-lock',
    shared: 'pundit-icon-users'
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

  changeLoadingState(loading: boolean) {
    this.output.isLoading = loading;
  }

  changeNotebookSelectorLoadingState(loading: boolean) {
    this.output._meta.notebookSelectorData.isLoading = loading;
  }
}
