import { DataSource } from '@n7-frontend/core';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';

export class NotebookPanelDS extends DataSource {
  public labelMap = {
    public: 'All annotations in the notebook can be seen by all Pundit\'s users',
    private: 'All annotations in the notebook are visible only to you',
    shared: 'with X people',
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
      descriptions: this.labelMap,
      icons: this.iconMap,
    };
  }
}
