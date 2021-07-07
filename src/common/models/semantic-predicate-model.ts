import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

const DEFAULT_PREDICATES = [
  {
    label: 'identifies',
    uri: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy',
    description: 'The Subject (a text fragment or a web page) is a representation of the Object (text fragment, web page or linked data entity).'
  },
  {
    label: 'is related to',
    uri: 'http://www.w3.org/2004/02/skos/core#related',
    description: 'The Subject (a text fragment or a web page) has a generic relation with the Object (text fragment, web page or linked data entity).'
  },
  {
    label: 'describes',
    uri: 'http://purl.org/spar/cito/describes',
    description: 'The Subject (a text fragment or a web page) describes the Object (text fragment, web page or linked data entity).'
  },
  {
    label: 'has author',
    uri: 'http://purl.org/dc/terms/creator',
    description: 'The Subject (a text fragment or a web page) was written or created by a specific person identified by the Object.'
  },
  {
    label: 'has type',
    uri: 'http://purl.org/dc/terms/type',
    description: 'The Subject (a text fragment or a web page) has a specified type identified by the Object.'
  },
  {
    label: 'cites',
    uri: 'http://purl.org/spar/cito/cites',
    description: 'The Subject (a text fragment or a web page) cites the Object (text fragment, web page or linked data entity).'
  },
  {
    label: 'quotes',
    uri: 'http://purl.org/spar/cito/includesQuotationFrom',
    description: "The Subject (a text fragment or a web page) is a sentence from a person or a work identified by the Object. It is usually enclosed by quotations (eg: '')."
  },
  {
    label: 'replies to',
    uri: 'http://purl.org/spar/cito/repliesTo',
    description: 'The Subject (a text fragment or a web page) is a reply to the Object (text fragment, web page or linked data entity).'
  },
  {
    label: 'represents the date',
    uri: 'http://purl.org/dc/terms/date',
    description: 'The Subject (a text fragment) corresponds to a date that can be defined by a year, a month, a day or a time. Use the calendar to select the right date as object.'
  }
];

export class SemanticPredicateModel {
  @CrossMessage(CrossMsgRequestId.SemanticPredicateGet)
  static get() {
    return new Promise((res) => {
      res({
        status: 200,
        data: DEFAULT_PREDICATES
      });
    });
  }
}
