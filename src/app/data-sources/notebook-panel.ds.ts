import { DataSource } from '@n7-frontend/core';

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
    return {
      ...data,
      descriptions: this.labelMap,
      icons: this.iconMap,
    };
  }
}
