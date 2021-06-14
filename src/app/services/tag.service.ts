import { Injectable } from '@angular/core';
import { Tag } from '@pundit/communication';
import Tagify from '@yaireo/tagify';

@Injectable()
export class TagService {
  private tags: Tag[] = [];

  private suggestionList: Tag[] = [];

  private formInstance: any;

  init(reference) {
    const tagFormConfig = {
      pattern: /^\w{1,128}$/,
      delimiters: ',| ',
      maxTags: 20,
      whitelist: this.suggestionList, // use tagservice to fetch tags;
      transformTag: this.transformTag,
      backspace: 'edit',
      placeholder: 'Add a tag',
      dropdown: {
        enabled: 1,
        fuzzySearch: false,
        position: 'text',
        caseSensitive: true
      }
    };
    this.formInstance = new Tagify(reference, tagFormConfig);
    this.formInstance.on('add', (e) => {
      const value = e?.detail?.data?.value;
      if (value) this.tags.push(value);
    });
    this.formInstance.on('remove', (e) => {
      const value = e?.detail?.data?.value;
      if (value) {
        const index = this.tags.indexOf(value);
        if (index > -1) {
          this.tags.splice(index, 1);
        }
      }
    });
    this.formInstance.on('edit:updated', (e) => {
      const newValue = e?.detail?.data?.value;
      const prevValue = e?.detail?.data?.previousData?.value;
      if (newValue && prevValue) {
        const index = this.tags.indexOf(prevValue);
        if (index > -1) {
          this.tags[index] = newValue;
        }
      }
    });
    this.updateFormIstance();
    return this.formInstance;
  }

  loadSuggestionList(tags: Tag[]) {
    if (Array.isArray(tags)) this.suggestionList = tags;
    else this.suggestionList = [];
  }

  setTags(tags: Tag[]) {
    if (!Array.isArray(tags)) {
      return;
    }
    tags.forEach((tag) => {
      if (this.tags.indexOf(tag) <= -1) {
        this.tags.push(tag);
      }
    });
    this.updateFormIstance();
  }

  get(): Tag[] {
    return Object.assign([], this.tags);
  }

  clear() {
    this.tags = [];
    this.updateFormIstance();
  }

   private updateFormIstance = () => {
     if (this.formInstance) {
       // TODO ottimizzare
       this.formInstance.removeAllTags();
       this.formInstance.addTags(this.get());
     }
   }

   // generate a random color (in HSL format, which I like to use)
  private getRandomColor = () => {
    const rand = (min, max) => min + Math.random() * (max - min);

    const h = Math.trunc(rand(1, 360));
    const s = Math.trunc(rand(40, 70));
    const l = Math.trunc(rand(65, 72));

    return `hsl(${h},${s}%,${l}%)`;
  }

  private transformTag = (tagData) => {
    tagData.style = `--tag-bg:${this.getRandomColor()}`;
  }
}
