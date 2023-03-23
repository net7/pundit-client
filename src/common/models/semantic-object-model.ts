import { sample } from 'lodash';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

const mock = (query: string) => {
  const types = ['literal', 'entity', 'class'];
  return query.length < 7 ? Array(Math.round(Math.random() * 50)).fill(null).map((_, index) => ({
    label: `Item ${index}`,
    uri: 'https://example.com',
    uriLabel: 'example',
    type: sample(types),
    description: 'The Subject (a text fragment or a web page) cites the Object (text fragment, web page or linked data entity).'
  })) : [];
};

export class SemanticObjectModel {
  @CrossMessage(CrossMsgRequestId.SemanticObjectSearch)
  static search(query: string) {
    console.warn('FIXME: aggiungere richiesta', query);
    return new Promise((res) => {
      res({
        status: 200,
        data: mock(query)
      });
    });
  }
}
