import { DataSource, _t } from '@n7-frontend/core';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';

export class NotebookPanelDS extends DataSource {
  public labels = {
    current: _t('notebookpanel#current'),
    changeStatus: _t('notebookpanel#changestatus'),
    sharedSoon: _t('notebookpanel#sharedsoon'),
    changeCurrent: _t('notebookpanel#changecurrent'),
    statusTitle: _t('notebookpanel#status'),
    status: {
      public: _t('notebookpanel#status_public'),
      private: _t('notebookpanel#status_private'),
      shared: _t('notebookpanel#status_shared'),
    },
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
}
