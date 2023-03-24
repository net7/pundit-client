import { LayoutDataSource, _t } from '@net7/core';
import {
  BehaviorSubject, Subject
} from 'rxjs';
import { _c } from 'src/app/models/config';
import { AnnotationConfig, AnnotationService } from 'src/app/services/annotation.service';
import { UserService } from 'src/app/services/user.service';
import { AnnotationPositionService } from 'src/app/services/annotation-position.service';
import { getDocumentHref } from 'src/app/models/annotation/html-util';
import { TagService } from 'src/app/services/tag.service';
import { SemanticOnthologiesService } from 'src/app/services/semantic-onthologies.service';
import { NotebookService } from '../../services/notebook.service';

const REPORT_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLSfC-bkKWVOa52BP05FWwyZW446KlVnEv2w5gmZhs1BMvZn0Rg/viewform?usp=pp_url&entry.1925380618';

export class SidebarLayoutDS extends LayoutDataSource {
  private annotationService: AnnotationService;

  private annotationPositionService: AnnotationPositionService;

  private notebookService: NotebookService;

  private tagService: TagService;

  public semanticOnthologiesService: SemanticOnthologiesService;

  public userService: UserService;

  /** open/close the sidebar */
  public isCollapsed = new BehaviorSubject(true);

  /** open/close the notebook editor panel */
  public notebookEditor = new BehaviorSubject(false);

  /** open/close the onthologies editor panel */
  public onthologiesEditor = new BehaviorSubject(false);

  /** dynamically update the document height on scroll */
  public height$: Subject<string> = new Subject();

  public annotations: AnnotationConfig[] = null ;

  public userLink = _c('userLink');

  public notificationsLink = _c('notificationsLink');

  /** Data for the popover that appears when clicking on the user name */
  public userPopover = {
    isOpen: new BehaviorSubject(false),
    items: [
      { label: _t('userpopover#notebooks'), href: _c('userLink') },
      { label: _t('userpopover#report'), href: `${REPORT_LINK}=${getDocumentHref()}` },
      { label: _t('userpopover#logout'), payload: 'clicklogout' },
    ]
  }

  public fullpage = {
    isExpanded: false
  }

  public labels = {
    fullpage: {
      show: _t('sidebaractions#fullpage_show'),
      hide: _t('sidebaractions#fullpage_hide'),
      add: _t('fullpage#add'),
      options: {
        tagging: _t('tooltip#tag'),
        commenting: _t('tooltip#comment'),
        linking: _t('tooltip#semantic')
      }
    },
    notebookpanel: {
      show: _t('sidebaractions#notebookpanel_show'),
      hide: _t('sidebaractions#notebookpanel_hide')
    },
    onthologiespanel: {
      show: _t('sidebaractions#onthologiespanel_show'),
      hide: _t('sidebaractions#onthologiespanel_hide')
    },
    notifications: {
      show: _t('sidebaractions#notifications_show')
    },
    collapse: _t('sidebaractions#collapse')
  }

  onInit(payload) {
    this.annotationService = payload.annotationService;
    this.annotationPositionService = payload.annotationPositionService;
    this.notebookService = payload.notebookService;
    this.userService = payload.userService;
    this.tagService = payload.tagService;
    this.semanticOnthologiesService = payload.semanticOnthologiesService;

    // add annotation service to event handler
    // to identify the single annotation
    const annotationsEH = this.getWidgetEventHandler('annotation');
    annotationsEH.annotationService = this.annotationService;
  }

  updateNotebookPanel() {
    const currentUser = this.userService.whoami();
    if (currentUser) {
      this.one('notebook-panel').update({
        selected: this.notebookService.getSelected(),
        list: this.notebookService.getByUserId(currentUser.id)
      });
    }
  }

  updateOnthologiesPanel() {
    this.one('onthologies-panel').update(this.semanticOnthologiesService.get());
  }

  updateAnnotations(load = false) {
    if (load) {
      this.annotations = this.annotationService.getAnnotationsToShow();
    }

    // fix elements load delay
    setTimeout(() => {
      this.annotationPositionService.update();
    });
  }

  onUsernameClick(ev: MouseEvent) {
    ev.stopImmediatePropagation();
    this.userPopover.isOpen.next(!this.userPopover.isOpen.getValue());
  }

  onFullpageDropdownToggle() {
    this.fullpage.isExpanded = !this.fullpage.isExpanded;
  }
}
