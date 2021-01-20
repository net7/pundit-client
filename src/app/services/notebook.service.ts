import { Injectable } from '@angular/core';
import { Notebook } from '@pundit/communication';

export type NotebookData = {
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
    rawNotebooks.forEach((rawNotebook) => {
      this.add(rawNotebook);
    });
  }

  add(rawNotebook: Notebook) {
    if (!this.getNotebookById(rawNotebook.id)) {
      const { id, label, sharingMode } = rawNotebook;
      this.notebooks.push({ id, label, sharingMode });
    }
  }

  getNotebookById(notebookId: string): NotebookData | null {
    return this.notebooks.find(({ id }) => id === notebookId) || null;
  }

  getAll = (): NotebookData[] => this.notebooks;
}
