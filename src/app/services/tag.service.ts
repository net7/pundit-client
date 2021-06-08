import { Injectable } from '@angular/core';
import { Tag } from '@pundit/communication';

@Injectable()
export class TagService {
    private tags: Tag[] = [];

    load(tags: Tag[]) {
      return tags;
    }

    add(tag: Tag) {
      return tag;
    }
}
