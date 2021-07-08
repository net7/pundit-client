import { SemanticGenericProvider } from './semantic-generic.provider';

export class SemanticTextProvider extends SemanticGenericProvider {
  get(uri: string) {
    return {
      label: uri,
      uri: null,
    };
  }
}
