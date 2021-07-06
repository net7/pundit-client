import { of } from 'rxjs';
import { SemanticItem, SemanticProvider } from 'src/app/types';

export class SemanticGenericProvider implements SemanticProvider {
  selected: SemanticItem = null;

  constructor(
    public id: string,
    public label: string,
    public items: SemanticItem[] = [],
  ) {}

  get(uri: string) {
    return this.items.find((item) => item.uri === uri);
  }

  search(query?: string) {
    let found = this.items;
    if (typeof query === 'string' && query.length) {
      found = this.items.filter(({ label }) => {
        const haystack = label.toLowerCase();
        const needle = query.toLowerCase();
        return haystack.indexOf(needle) !== -1;
      });
    }
    return of(found.sort((a, b) => a.label.localeCompare(b.label)));
  }

  setSelected(uri: string) {
    this.selected = this.get(uri) || null;
  }
}
