import { DataSource } from '@net7/core';

export class NotebookSelectorDS extends DataSource {
  transform(data: any) {
    return data;
  }
}
