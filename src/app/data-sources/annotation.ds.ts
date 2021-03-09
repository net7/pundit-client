import { DataSource, _t } from '@n7-frontend/core';
import { Annotation } from '@pundit/communication';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationData } from '../components/annotation/annotation';
import { NotebookSelectorData } from '../components/notebook-selector/notebook-selector';
import { NotebookData } from '../services/notebook.service';
import { isAnchorPayload } from '../types';

export class AnnotationDS extends DataSource {
  private onMenuFocusLost = new Subject();

  transform(data: Annotation): AnnotationData {
    const {
      id,
      notebookId,
      userId,
      subject,
      created
    } = data;
    const {
      annotationUser,
      annotationNotebook,
      currentUser,
      currentUserNotebooks
    } = this.options;
    const { text } = subject.selected;
    const startPosition = subject.selected.textPositionSelector.start;
    const isCurrentUser = currentUser?.id === annotationUser.id;
    let comment;
    if (data.type === 'Commenting') {
      const { content } = data;
      comment = content.comment;
    }

    return {
      _meta: {
        id,
        created,
        startPosition,
        userId,
        notebookId
      },
      _raw: data,
      payload: {
        source: 'box',
        id
      },
      user: {
        image: annotationUser.thumb,
        name: annotationUser.username,
        anchor: isCurrentUser ? {
          payload: {
            source: 'user',
            id: annotationUser.id
          }
        } : null
      },
      isCollapsed: true,
      date: new Date(created).toLocaleDateString(),
      notebook: {
        name: annotationNotebook.label,
        anchor: {
          payload: {
            source: 'notebook',
            id: annotationNotebook.id
          }
        }
      },
      body: text,
      comment,
      menu: isCurrentUser ? {
        icon: {
          id: 'pundit-icon-ellipsis-v',
          payload: {
            id,
            source: 'menu-header',
          }
        },
        actions: [{
          label: _t('annotation#changenotebook'),
          payload: {
            id,
            source: 'action-notebooks'
          }
        }, {
          label: _t('annotation#editcomment'),
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
        }],
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
      } : null,
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
        if (!clickedElement.className
          .match(/(pnd-notebook-selector__)(selected|dropdown-new|create-field)/gi)) {
          this.onMenuFocusLost.next(true);
          this.closeActiveMenu();
        }
      });
  }

  setCollapsedState(collapse: boolean) {
    this.output.isCollapsed = collapse;
  }

  updateNotebooks() {
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
      }
    };
    this.output._meta.notebookSelectorData = notebookSelectorData;
    this.output.activeMenu = 'notebooks';
    this.listenDocumentClicks();
  }

  toggleActiveMenu() {
    this.output.activeMenu = this.output.activeMenu ? undefined : 'actions';
    this.listenDocumentClicks();
  }

  closeActiveMenu() {
    this.output.activeMenu = undefined;
  }

  onAnnotationUpdate(notebook) {
    this.output.notebook = {
      name: notebook.label,
      anchor: {
        payload: { source: 'notebook', id: notebook.id }
      }
    };
    if (this.output._meta?.notebookSelectorData) {
      this.output._meta.notebookSelectorData.selectedNotebook = notebook;
      this.output._meta.notebookId = notebook.id;
      this.output._meta.isExpanded = false;
      this.output.activeMenu = undefined;
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

  updateNotebook(notebookId: string, notebook: NotebookData) {
    if (notebookId && isAnchorPayload(this.output.notebook.anchor)) {
      // update the notebook
      this.output.notebook.anchor.payload.id = notebookId;
      this.output.notebook.name = notebook.label;
    }
  }

  updateComment(comment: string) {
    if (comment) {
      this.output.comment = comment;
    }
  }

  private toggleCollapse() {
    this.output.isCollapsed = !this.output.isCollapsed;
  }
}
