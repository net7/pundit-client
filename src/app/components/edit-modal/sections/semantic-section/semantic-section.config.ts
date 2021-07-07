import { SemanticGenericProvider, SemanticTextProvider } from 'src/app/models/semantic';
import { SemanticItem } from 'src/app/types';

export const DEFAULT_ID = 'pundit-basic';

export const config = {
  predicate: [{
    id: DEFAULT_ID,
    label: 'Basic Relation',
    provider: SemanticGenericProvider,
    items: [{
      description: 'Any concept coming from external vocabularies (OpenSKOS/Genre, Freebase, DbPedia) and digital objects from Europeana related to the audio resource.',
      label: 'has tag (talks about)',
      uri: 'http://purl.org/pundit/ont/oa#talksAbout'
    }, {
      label: 'is related to',
      description: 'The Subject (a text fragment or a web page) has a generic relation with the Object (text fragment, web page or linked data entity).',
      uri: 'http://www.w3.org/2004/02/skos/core#related'
    }] as SemanticItem[]
  }],
  object: [{
    id: DEFAULT_ID,
    label: 'Basic Object',
    provider: SemanticTextProvider,
    placeholder: 'Add object...',
    items: [] as SemanticItem[]
  }]
};
