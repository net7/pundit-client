import { Injectable } from '@angular/core';
import { Notebook } from '@pundit/communication';

type NotebookData = {
  id: string;
  label: string;
  sharingMode: string;
}

@Injectable()
export class NotebookService {
  private notebooks: NotebookData[] = [];

  private selectedId: string;

  public getSelected = () => this.getNotebookById(this.selectedId);

  public setSelected(id: string) {
    this.selectedId = id;
  }

  load(rawNotebooks: Notebook[]) {
    this.notebooks = rawNotebooks.map(({ id, label, sharingMode }) => ({ id, label, sharingMode }));
  }

  getNotebookById(notebookId: string): NotebookData | null {
    return this.notebooks.find(({ id }) => id === notebookId) || null;
  }
}
