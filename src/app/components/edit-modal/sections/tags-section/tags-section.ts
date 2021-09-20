import {
  Component,
  ElementRef,
  Input,
  AfterViewInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { _t } from '@n7-frontend/core';
import Tagify from '@yaireo/tagify';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { getTagColor } from 'src/app/helpers/tag-color.helper';
import { _c } from 'src/app/models/config';
import { TagService } from 'src/app/services/tag.service';
import { FormSection, FormSectionData } from 'src/app/types';
import { customDropdownHide, customShadowRootRender } from './tagify-custom';

export type TagsSectionValue = string[];

export type TagsSectionOptions = {
  label: string;
};

@Component({
  selector: 'pnd-tags-section',
  templateUrl: './tags-section.html'
})
export class TagsSectionComponent implements AfterViewInit, OnDestroy, FormSection<
  TagsSectionValue, TagsSectionOptions
> {
  id = 'tags';

  @Input() public data: FormSectionData<TagsSectionValue, TagsSectionOptions>;

  @Input() public reset$: Subject<void>;

  @ViewChild('tagifyInputRef') tagifyInputRef: ElementRef<HTMLInputElement>;

  private destroy$: Subject<void> = new Subject();

  private formInstance;

  public tagsHint = _c('tagsHint');

  constructor(private tagService: TagService) {}

  ngAfterViewInit() {
    this.init();
    this.checkFocus();
    this.reset$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(this.onReset);
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  private init = () => {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const targetRef = shadowRoot.querySelector('.pnd-edit-modal__tags-input-wrapper');
    const tagFormConfig = {
      pattern: /^\w{2,128}$/,
      delimiters: ',| ',
      maxTags: 20,
      transformTag: this.transformTag,
      backspace: 'edit',
      placeholder: _t('editmodal#add_tag'),
      dropdown: {
        enabled: 1,
        fuzzySearch: false,
        position: 'all',
        caseSensitive: false,
        appendTarget: targetRef
      }
    };
    this.formInstance = new Tagify(
      this.tagifyInputRef.nativeElement,
      tagFormConfig
    );
    this.formInstance.dropdown.render = customShadowRootRender.bind(this.formInstance);
    this.formInstance.dropdown.hide = customDropdownHide.bind(this.formInstance);

    if (Array.isArray(this.data.initialValue)) {
      this.formInstance.addTags(this.data.initialValue);
    }
    this.formInstance.on(
      'add remove edit:updated',
      () => {
        setTimeout(() => {
          const elements = this.formInstance.getTagElms();
          this.data.changed$.next({
            id: this.id,
            value: elements.map((el) => el.innerText)
          });
        });
      }
    );
    // suggestion list
    this.tagService.get$().pipe().subscribe((whitelist) => {
      this.formInstance.settings.whitelist = whitelist;
    });
  }

  private transformTag = (tagData) => {
    const tagColor = getTagColor(tagData.value);
    tagData.style = `--tag-bg:${tagColor}`;
  }

  private onReset = () => {
    const { initialValue } = this.data;
    this.formInstance.removeAllTags();
    if (Array.isArray(initialValue)) {
      this.formInstance.addTags(initialValue);
    }
    this.checkFocus();
  }

  private checkFocus = () => {
    const { focus } = this.data;
    if (focus) {
      setTimeout(() => {
        const { input } = this.formInstance.DOM;
        (input as HTMLInputElement).focus();
      });
    }
  }
}
