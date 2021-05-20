import { CrossMessageRequestId } from '../types';
import { CrossMessage } from '../cross-message';

export class TestModel {
  static baseUrl = 'https://jsonplaceholder.typicode.com';

  @CrossMessage(CrossMessageRequestId.TestGet)
  static get(id: number) {
    return fetch(`${TestModel.baseUrl}/posts/${id}`);
  }

  @CrossMessage(CrossMessageRequestId.TestCreate)
  static create(data: {
    title: string;
    body: string;
    userId: number;
  }) {
    return fetch(`${TestModel.baseUrl}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    });
  }

  getBaseUrl = () => TestModel.baseUrl;
}
