import { SemanticGenericProvider } from './semantic-generic.provider';

const URI_PREFIX = 'uri://pundit-custom/';

export class SemanticTextProvider extends SemanticGenericProvider {
  get(uri: string) {
    return {
      uri: `${URI_PREFIX}#${uri}`,
      label: uri,
    };
  }
}
