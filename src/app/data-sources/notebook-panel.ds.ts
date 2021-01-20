import { DataSource } from '@n7-frontend/core';

export class NotebookPanelDS extends DataSource {
  public labelMap = {
    public: 'All annotations in the notebook can be seen by all Pundit\'s users',
    private: 'All annotations in the notebook are visible only to you',
    shared: 'with X people',
  }

  public iconMap = {
    public: '',
    private: 'n7-icon-lock',
    shared: 'n7-icon-users'
  }

  transform(data) {
    return {
      ...data,
      description: this.labelMap[data.selected.sharingMode],
      icon: this.iconMap[data.selected.sharingMode]
    };
  }
}
