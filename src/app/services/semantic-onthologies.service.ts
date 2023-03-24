import { Injectable } from '@angular/core';
import { EMPTY, from } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SemanticOnthologiesModel } from 'src/common/models';
import { OnthologyItem } from '../components/onthologies-panel/onthologies-panel';

@Injectable()
export class SemanticOnthologiesService {
    private items: OnthologyItem[];

    load(items: OnthologyItem[]) {
      if (Array.isArray(items)) {
        this.items = [];
        items.forEach((item) => {
          this.add(item);
        });
      }
    }

    private add(item: OnthologyItem) {
      if (!this.items.find(({ id }) => item.id === id)) {
        this.items.push(item);
      }
    }

    get = () => this.items;

    public setSelected(selected: string[]) {
      return from(SemanticOnthologiesModel.setSelected(selected)).pipe(
        catchError((err) => {
          console.warn('SemanticOnthologiesService setSelected error:', err);
          return EMPTY;
        })
      );
    }

    clear() {
      this.items = [];
    }
}
