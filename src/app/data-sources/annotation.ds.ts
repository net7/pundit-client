import { DataSource, _t } from '@n7-frontend/core';
import { Annotation } from '@pundit/communication';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationData } from '../components/annotation/annotation';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';
import { _c } from '../models/config';
import { NotebookData } from '../services/notebook.service';

export enum AnnotationCssClass {
  Empty = '',
  Delete = 'is-deleted',
  Edit = 'is-edited'
}

export class AnnotationDS extends DataSource {
  private onMenuFocusLost = new Subject();

  transform(data: Annotation): AnnotationData {
    const {
      id,
      notebookId,
      userId,
      subject,
      created,
      tags
    } = data;
    const { text } = subject.selected;
    const startPosition = subject.selected.textPositionSelector.start;
    const notebookSelectorData: NotebookSelectorData = {
      selectedNotebook: undefined,
      notebookList: undefined,
      mode: 'select',
      _meta: {
        isExpanded: false,
      }
    };

    // check comment
    let comment;
    if (data.type === 'Commenting') {
      const { content } = data;
      comment = content.comment;
    }

    // check semantic
    let semantic;
    if (data.type === 'Linking') {
      const { content } = data;
      semantic = content;
    }

    return {
      _meta: {
        id,
        created,
        startPosition,
        userId,
        notebookId,
        notebookSelectorData
      },
      _raw: data,
      payload: {
        source: 'box',
        id
      },
      user: this.getUserData(),
      isCollapsed: true,
      date: new Date(created).toLocaleDateString(),
      notebook: this.getNotebookData(),
      body: text,
      comment,
      semantic,
      tags,
      menu: this.getMenuData(id, comment, tags),
    };
  }

  /**
   * Listen for clicks on the HTML document,
   * if the document is clicked outside of the inner menu
   * then the menu should be dismissed.
   */
  listenDocumentClicks() {
    fromEvent(document, 'click') // listen for clicks on the document
      .pipe(takeUntil(this.onMenuFocusLost)) // keep listening until the menu is closed
      .subscribe((e: PointerEvent) => {
        const clickedElement: Element = (e as any).path[0]; // get the element that was clicked
        // only act if the clicked item is NOT the notebook-selector component
        if (clickedElement.className && !clickedElement.className
          .match(/(pnd-notebook-selector__)(selected|dropdown-new|create-field|create-btn-save)/gi)) {
          this.onMenuFocusLost.next(true);
          this.closeMenu();
        }
      });
  }

  /**
   * Collapses or expands the annotation
   * @param collapse when set to false the full annotation will be visible
   */
  setCollapsedState(collapse: boolean) {
    this.output.isCollapsed = collapse;
  }

  /**
   * Reset the data for the notebook-selector component
   * to sync the notebook list.
   */
  refreshNotebookList() {
    const { notebookService } = this.options;
    const { notebookId, userId } = this.output._meta;
    const notebook = notebookService.getNotebookById(notebookId);
    const notebooks = notebookService.getByUserId(userId);
    const notebookSelectorData: NotebookSelectorData = {
      selectedNotebook: notebook,
      notebookList: notebooks,
      mode: 'select',
      createOption: {
        label: 'New notebook',
        value: 'createnotebook',
      },
      _meta: {
        isExpanded: false,
      }
    };
    this.output._meta.notebookSelectorData = notebookSelectorData;
    this.output.activeMenu = 'notebooks';
    this.listenDocumentClicks();
  }

  /** Open or close the actions popup */
  toggleActionsMenu() {
    this.output.activeMenu = this.output.activeMenu ? undefined : 'actions';
    this.listenDocumentClicks();
  }

  /** Closes the annotation popup */
  closeMenu() {
    this.output.activeMenu = undefined;
  }

  /**
   * Move an existing annotation to a different notebook
   *
   * @param destination new parent notebook
   */
  transferAnnotationToNotebook(destination) {
    // change the parent notebook in the annotation
    this.output.notebook = {
      name: destination.label,
      anchor: { payload: { source: 'notebook', id: destination.id } }
    };
    // change the parent notebook in the child components
    this.output._meta.notebookId = destination.id;
    this.updateSelectedNotebook(destination);
  }

  /**
   * Update the notebook selector component with the correct active notebook
   */
  updateSelectedNotebook(notebook: NotebookData) {
    const nbsData: NotebookSelectorData = this.output._meta.notebookSelectorData;
    nbsData.selectedNotebook = notebook;
    this.output._meta.notebookId = notebook.id;
    if (notebook.id) {
      // update the notebook
      this.output.notebook.anchor = this.getNotebookLink(notebook.id);
      this.output.notebook.name = notebook.label;
    }
  }

  onAnchorMouseOver() {
    this.output.classes = 'is-hovered';
  }

  onAnchorMouseLeave() {
    this.output.classes = '';
  }

  onAnchorClick() {
    this.toggleCollapse();
  }

  updateComment(comment: string) {
    if (comment) {
      this.output.comment = comment;
    }
  }

  removeComment() {
    if (this.output.comment) {
      this.output.comment = undefined;
    }
  }

  updateUser() {
    this.output.user = this.getUserData();
  }

  updateMenu() {
    const { id } = this.output._meta;
    this.output.menu = this.getMenuData(id);
  }

  updateNotebook() {
    this.output.notebook = this.getNotebookData();
  }

  updateTags(tags) {
    this.output.tags = Array.isArray(tags) ? tags : undefined;
  }

  updateCssClass(cssClass: AnnotationCssClass) {
    this.output.classes = cssClass;
  }

  private getNotebookLink = (id: string) => `${_c('notebookLink')}/${id}`

  private toggleCollapse() {
    this.output.isCollapsed = !this.output.isCollapsed;
  }

  private isCurrentUser() {
    const {
      annotationUser,
      currentUser,
    } = this.options;
    return currentUser?.id === annotationUser.id;
  }

  private getUserData() {
    const { annotationUser } = this.options;
    let separator = ' ';
    // is email check
    if (annotationUser.username.includes('@')) {
      separator = '@';
    }
    const initials = (annotationUser.username as string)
      .split(separator)
      .map((word: string) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return {
      initials,
      image: annotationUser.thumb || _c('userDefaultThumb'),
      name: annotationUser.username,
      anchor: this.isCurrentUser()
        ? _c('userLink')
        : null
    };
  }

  private getMenuData(id: string, comment?: string, tags?: string[]) {
    const hasComment = this.output
      ? !!this.output.comment
      : comment;
    const hasTags = this.output
      ? !!this.output.tags
      : (Array.isArray(tags) && tags.length);
    const { currentUserNotebooks } = this.options;
    const actions = this.createActionButtons(id, hasComment, hasTags);
    return this.isCurrentUser() ? {
      icon: {
        id: 'ellipsis-v',
        payload: {
          id,
          source: 'menu-header',
        }
      },
      actions,
      notebooks: {
        header: {
          label: _t('annotation#changenotebook'),
          payload: {
            id,
            source: 'notebooks-header'
          }
        },
        items: currentUserNotebooks
          .map(({ id: itemId, label }) => ({
            label,
            payload: {
              id,
              notebookId: itemId,
              source: 'notebook-item'
            }
          }))
      }
    } : null;
  }

  private createActionButtons(id: string, hasComment, hasTags) {
    const actions = [{
      label: _t('annotation#changenotebook'),
      payload: {
        id,
        source: 'action-notebooks'
      }
    }, {
      label: hasComment
        ? _t('annotation#editcomment')
        : _t('annotation#addcomment'),
      payload: {
        id,
        source: 'action-comment'
      }
    }, {
      label: _t('annotation#delete'),
      payload: {
        id,
        source: 'action-delete'
      }
    }];
    if (!hasComment) {
      const tagAction = {
        label: hasTags
          ? _t('annotation#edittags')
          : _t('annotation#addtags'),
        payload: {
          id,
          source: 'action-tags'
        }
      };
      actions.splice(2, 0, tagAction);
    }
    return actions;
  }

  private getNotebookData() {
    const { annotationNotebook } = this.options;
    return {
      name: annotationNotebook.label,
      anchor: this.isCurrentUser()
        ? this.getNotebookLink(annotationNotebook.id)
        : null
    };
  }

  changeNotebookSelectorLoadingState(loading: boolean) {
    this.output._meta.notebookSelectorData.isLoading = loading;
  }
}
