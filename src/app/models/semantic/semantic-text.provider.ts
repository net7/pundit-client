import { SemanticGenericProvider } from './semantic-generic.provider';

const URI_PREFIX = 'uri://pundit-fake-url/';

export class SemanticTextProvider extends SemanticGenericProvider {
  get(uri: string) {
    return {
      uri: `${URI_PREFIX}#${this.slugify(uri)}`,
      label: uri,
    };
  }

  private slugify(str: string) {
    return str
      .normalize('NFD') // split an accented letter in the base letter and the acent
      .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
      .replace(/\s+/g, '-');
  }
}
