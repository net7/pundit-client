import { notebook, NotebookAttributes, NotebookPermissions } from '@pundit/communication';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

const usersMock = () => Array(Math.round(Math.random() * 10)).fill(null).map((_, i) => ({
  username: `User ${i}`,
  email: `email-${i}@example.com`,
  thumb: `https://i.pravatar.cc/50?img${i}`
}));

const okMock = () => ({ status: 'ok' });

export class NotebookModel {
  @CrossMessage(CrossMsgRequestId.NotebookCreate)
  static create({ data }: { data: NotebookAttributes }) {
    return notebook.create(data);
  }

  @CrossMessage(CrossMsgRequestId.NotebookRemove)
  static remove(id: string) {
    return notebook.remove(id);
  }

  @CrossMessage(CrossMsgRequestId.NotebookSearch)
  static search() {
    return notebook.search({ size: 50 });
  }

  @CrossMessage(CrossMsgRequestId.NotebookUpdate)
  static update(id: string, { data }: { data: NotebookAttributes }) {
    // change the notebook data on the backend
    return notebook.update(id, data);
  }

  @CrossMessage(CrossMsgRequestId.NotebookSetDefault)
  static setDefault(id: string) {
    // change the default notebook
    return notebook.setDefault(id);
  }

  @CrossMessage(CrossMsgRequestId.NotebookUserSearch)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static userSearch(query: string) {
    // FIXME: togliere mock
    // return notebook.userSearch({ query, size: 10 });
    // console.warn('FIXME: togliere mock:', query);
    return Promise.resolve(usersMock());
  }

  @CrossMessage(CrossMsgRequestId.NotebookUserInviteWithEmail)
  static userInviteWithEmail(id: string, data: NotebookPermissions) {
    return notebook.share(id, data);
  }

  @CrossMessage(CrossMsgRequestId.NotebookGetData)
  static getData(id: string) {
    return notebook.get(id);
  }

  @CrossMessage(CrossMsgRequestId.NotebookUserInviteWithId)
  static userInviteWithId(id: string | number) {
    // FIXME: togliere mock
    // return notebook.userSearch({ query, size: 10 });
    console.warn('FIXME: togliere mock:', id);
    return Promise.resolve(okMock());
  }

  @CrossMessage(CrossMsgRequestId.NotebookUserRemove)
  static userRemove(id: string | number) {
    // FIXME: togliere mock
    // return notebook.userSearch({ query, size: 10 });
    console.warn('FIXME: togliere mock:', id);
    return Promise.resolve(okMock());
  }
}
