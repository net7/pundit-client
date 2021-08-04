import { Injectable } from '@angular/core';
import { SemanticItem } from '../types';

@Injectable()
export class SemanticPredicateService {
    private items: SemanticItem[];

    load(items: SemanticItem[]) {
      if (Array.isArray(items)) {
        this.items = [];
        items.forEach((item) => {
          this.add(item);
        });
      }
    }

    private add(item: SemanticItem) {
      if (this.items.indexOf(item) <= -1) {
        this.items.push(item);
      }
    }

    get = () => this.items;

    clear() {
      this.items = [];
    }
}
