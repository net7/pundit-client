import { Injectable } from '@angular/core';
import { Tag } from '@pundit/communication';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable()
export class TagService {
    private tags$: Subject<Tag[]> = new BehaviorSubject([]);

    private tags;

    load(tags: Tag[]) {
      if (Array.isArray(tags)) {
        this.tags = [];
        tags.forEach((tag) => {
          this.add(tag);
        });
        this.tags$.next(this.tags);
      }
    }

    private add(tag: Tag) {
      if (this.tags.indexOf(tag) <= -1) {
        this.tags.push(tag);
      }
    }

    addMany(tags: Tag[]) {
      if (Array.isArray(tags) && tags.length) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i].replace('\n', '');
          tags[i] = tag;
          this.add(tag);
        }
        this.tags$.next(this.get());
      }
    }

    get() {
      return Object.assign([], this.tags);
    }

    get$() {
      return this.tags$.asObservable();
    }

    clear() {
      this.tags = [];
    }
}
