import { Injectable } from '@angular/core';
import { Tag } from '@pundit/communication';

@Injectable()
export class TagService {
    private tags: Tag[] = [];

    load(tags: Tag[]) {
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          this.add(tag);
        });
      }
    }

    add(tag: Tag) {
      if (this.tags.indexOf(tag) > -1) {
        this.tags.push(tag);
      }
    }

    clear() {
      this.tags = [];
    }
}
