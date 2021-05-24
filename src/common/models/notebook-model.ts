import { notebook, NotebookAttributes } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class NotebookModel {
  @CrossMessage(CrossMsgRequestId.NotebookCreate)
  static create({ data }: { data: NotebookAttributes }) {
    return notebook.create({ data });
  }

  @CrossMessage(CrossMsgRequestId.NotebookRemove)
  static remove(id: string) {
    return notebook.remove(id);
  }

  @CrossMessage(CrossMsgRequestId.NotebookSearch)
  static search() {
    return notebook.search({
      data: {
        size: 20
      }
    });
  }

  @CrossMessage(CrossMsgRequestId.NotebookUpdate)
  static update(id: string, { data }: { data: NotebookAttributes }) {
    // change the notebook data on the backend
    return notebook.update(id, { data });
  }
}
