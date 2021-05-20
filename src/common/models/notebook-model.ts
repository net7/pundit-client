import { notebook, NotebookAttributes } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';
import { environment as env } from '../../environments/environment';

export class NotebookModel {
  static baseUrl = env.baseURL;

  @CrossMessage(CrossMsgRequestId.NotebookCreate)
  static create({ data }: { data: NotebookAttributes }) {
    const baseURL = NotebookModel.baseUrl;
    return notebook.create({ baseURL, data });
  }

  @CrossMessage(CrossMsgRequestId.NotebookRemove)
  static remove(id: string) {
    const baseURL = NotebookModel.baseUrl;
    return notebook.remove(id, { baseURL });
  }

  @CrossMessage(CrossMsgRequestId.NotebookSearch)
  static search() {
    const baseURL = NotebookModel.baseUrl;
    return notebook.search({
      baseURL,
      data: {
        size: 20
      }
    });
  }

  @CrossMessage(CrossMsgRequestId.NotebookUpdate)
  static update(id: string, { data }: { data: NotebookAttributes }) {
    // change the notebook data on the backend
    const baseURL = NotebookModel.baseUrl;
    return notebook.update(id, { baseURL, data });
  }
}
