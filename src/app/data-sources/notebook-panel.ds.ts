import { DataSource } from '@n7-frontend/core';

export class NotebookPanelDS extends DataSource {
  public labels = {
    public: 'All annotations in the notebook can be seen by all Pundit\'s users',
    private: 'All annotations in the notebook are visible only to you',
    shared: 'with X people',
  }

  transform(data) {
    return { ...data, description: this.labels[data.status] };
  }
}
