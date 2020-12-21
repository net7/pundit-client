import { Injectable } from '@angular/core';

type Notebook = {
  id: string;
  label: string;
  sharingMode: string;
}

@Injectable()
export class NotebookService {
  private notebooks: Notebook[] = [];

  // FIXME: mettere type definitivi
  load(rawNotebooks: any[]) {
    this.notebooks = rawNotebooks.map(({ id, label, sharingMode }) => ({ id, label, sharingMode }));
  }

  getNotebookById(notebookId: string): Notebook | null {
    return this.notebooks.find(({ id }) => id === notebookId) || null;
  }
}
