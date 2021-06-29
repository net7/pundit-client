import {
  Component,
  ElementRef,
  Input,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { _t } from '@n7-frontend/core';
import Tagify from '@yaireo/tagify';
import { Subject } from 'rxjs';
import { getTagColor } from 'src/app/helpers/tag-color.helper';
import { TagService } from 'src/app/services/tag.service';
import { FormSection, FormSectionData } from 'src/app/types';

export type TagsSectionValue = string[];

export type TagsSectionOptions = {
  label: string;
};

@Component({
  selector: 'pnd-tags-section',
  templateUrl: './tags-section.html'
})
export class TagsSectionComponent implements AfterViewInit, FormSection<
  TagsSectionValue, TagsSectionOptions
> {
  id = 'tags';

  @Input() public data: FormSectionData<TagsSectionValue, TagsSectionOptions>;

  @Input() public reset$: Subject<void>;

  @ViewChild('tagifyInputRef') tagifyInputRef: ElementRef<HTMLInputElement>;

  private formInstance;

  constructor(private tagService: TagService) {}

  ngAfterViewInit() {
    this.init();
    this.checkFocus();
    this.reset$.subscribe(this.onReset);
  }

  private init = () => {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const targetRef = shadowRoot.querySelector('.pnd-edit-modal__tag-wrapper');
    const tagFormConfig = {
      pattern: /^\w{2,128}$/,
      delimiters: ',| ',
      maxTags: 20,
      transformTag: this.transformTag,
      backspace: 'edit',
      placeholder: _t('commentmodal#add_tag'),
      dropdown: {
        enabled: 0,
        fuzzySearch: false,
        position: 'all',
        caseSensitive: true,
        appendTarget: targetRef
      }
    };
    this.formInstance = new Tagify(
      this.tagifyInputRef.nativeElement,
      tagFormConfig
    );
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
    this.formInstance.on(
      'blur dropdown:select',
      () => {
        setTimeout(() => {
          this.tagifyDropdownManualHide();
        });
      }
    );
    // suggestion list
    this.tagService.get$().pipe().subscribe((whitelist) => {
      this.formInstance.settings.whitelist = whitelist;
    });
  }

  // clone of tagify dropdown hide method
  // to fix shadowroot check
  // <tagify>/src/parts/dropdown.js:hide( force )
  private tagifyDropdownManualHide(force = false): any {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const _instance = this.formInstance;
    const { scope, dropdown } = _instance.DOM;
    const isManual = _instance.settings.dropdown.position === 'manual' && !force;

    // if there's no dropdown, this means the dropdown events aren't binded
    if (!dropdown || !shadowRoot.contains(dropdown) || isManual) {
      return null;
    }

    window.removeEventListener('resize', _instance.dropdown.position);
    _instance.dropdown.events.binding.call(_instance, false); // unbind all events

    scope.setAttribute('aria-expanded', false);
    dropdown.parentNode.removeChild(dropdown);

    setTimeout(() => {
      _instance.state.dropdown.visible = false;
    }, 100);

    _instance.state.dropdown.query = null;
    _instance.state.ddItemData = null;
    _instance.state.ddItemElm = null;
    _instance.state.selection = null;

    if (_instance.state.tag && _instance.state.tag.value.length) {
      _instance.state.flaggedTags[_instance.state.tag.baseOffset] = _instance.state.tag;
    }

    _instance.trigger('dropdown:hide', dropdown);

    return _instance;
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
