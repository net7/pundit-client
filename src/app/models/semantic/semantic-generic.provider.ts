import { of } from 'rxjs';
import { SemanticItem, SemanticProvider } from 'src/app/types';

export class SemanticGenericProvider implements SemanticProvider {
  selected: SemanticItem = null;

  public id: string;

  public label: string;

  public items: SemanticItem[];

  constructor({ id, label, items }: {
    id: string;
    label: string;
    items: SemanticItem[];
  }) {
    this.id = id;
    this.label = label;
    this.items = items;
  }

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
