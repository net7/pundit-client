import { Injectable } from '@angular/core';
import { Tag } from '@pundit/communication';

@Injectable()
export class TagService {
  private tags: Tag[] = [];

  load(tags: Tag[]) {
    tags.forEach((tag) => {
      this.add(tag);
    });
  }

  add(tag: Tag) {
    if (this.tags.indexOf(tag) <= -1) {
      this.tags.push(tag);
    }
  }

  get(): Tag[] {
    return this.tags;
  }

  clear() {
    this.tags = [];
  }
}
