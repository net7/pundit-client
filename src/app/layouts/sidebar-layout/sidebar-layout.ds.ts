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
// Luca - da togliere?
import { DocumentInfoService } from 'src/app/services/document-info/document-info.service';
import { NotebookService } from '../../services/notebook.service';

const REPORT_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLSfC-bkKWVOa52BP05FWwyZW446KlVnEv2w5gmZhs1BMvZn0Rg/viewform?usp=pp_url&entry.1925380618';

export class SidebarLayoutDS extends LayoutDataSource {
  private annotationService: AnnotationService;

  private annotationPositionService: AnnotationPositionService;

  private notebookService: NotebookService;

  private tagService: TagService;

  public userService: UserService;

  // Luca - da togliere?
  public documentInfoService: DocumentInfoService;

  /** open/close the sidebar */
  public isCollapsed = new BehaviorSubject(false);

  /** open/close the notebook editor panel */
  public notebookEditor = new BehaviorSubject(false);

  /** dynamically update the document height on scroll */
  public height$: Subject<string> = new Subject();

  public annotations: AnnotationConfig[] = null ;

  public hypothesisAnnotations = [];

  public userLink = _c('userLink');

  public notificationsLink = _c('notificationsLink');

  public hypothesisLabels = {
    showHypo: {
      label: _t('userpopover#hypothesisIsOff'),
      payload: 'clickshowhypo'
    },
    hideHypo: {
      label: _t('userpopover#hypothesisIsOn'),
      payload: 'clickhidehypo'
    }
  };

  /** Data for the popover that appears when clicking on the user name */
  public userPopover = {
    isOpen: new BehaviorSubject(false),
    items: [
      { label: _t('userpopover#notebooks'), href: _c('userLink') },
      { label: _t('userpopover#report'), href: `${REPORT_LINK}=${getDocumentHref()}` },
      this.hypothesisLabels.showHypo,
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
    notifications: {
      show: _t('sidebaractions#notifications_show')
    },
    collapse: _t('sidebaractions#collapse')
  }

  public usersList = []

  onInit(payload) {
    this.annotationService = payload.annotationService;
    this.annotationPositionService = payload.annotationPositionService;
    this.notebookService = payload.notebookService;
    this.userService = payload.userService;
    this.tagService = payload.tagService;
    // Luca - da togliere?
    this.documentInfoService = payload.documentInfoService;

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
        list: this.notebookService.getByUserId(currentUser.id),
        usersList: this.usersList
      });
    }
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
