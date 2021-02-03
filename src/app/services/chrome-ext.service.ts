import { Injectable } from '@angular/core';
import { delay } from 'rxjs/operators';
import { config } from '../models/config';
import { AnchorService } from './anchor.service';
import { AnnotationService } from './annotation.service';
import { NotebookService } from './notebook.service';
import { UserService } from './user.service';

@Injectable()
export class ChromeExtService {
  constructor(
    private anchorService: AnchorService,
    private annotationService: AnnotationService,
    private userService: UserService,
    private notebookService: NotebookService,
  ) {}

  load(): Promise<void> {
    return new Promise((res) => {
      window.addEventListener('punditloaded', (ev: CustomEvent) => {
        const { id, user, token } = ev.detail;
        config.set('chromeExtId', id);
        config.set('chromeExtUrl', `chrome-extension://${id}`);
        if (user && token) {
          this.userService.iam(user);
          this.userService.setToken(token);
          this.userService.logged$.next(true);
        }
        this.listenExtensionEvents();
        this.listenAnnotationUpdates();
        this.listenNotebookUpdates();
        this.listenLoginEvents();
        res();
      }, false);
    });
  }

  private listenExtensionEvents() {
    // destroy
    window.addEventListener('punditdestroy', async () => {
      this.anchorService.removeAll();
    }, false);
  }

  private listenAnnotationUpdates() {
    this.annotationService.totalChanged$.pipe(
      delay(1) // symbolic delay waiting for extension load
    ).subscribe((number) => {
      // emit signal
      const signal = new CustomEvent('annotationsupdate', { detail: { total: number } });
      window.dispatchEvent(signal);
    });
  }

  private listenNotebookUpdates() {
    this.notebookService.selectedChanged$.pipe(
      delay(1) // symbolic delay waiting for extension load
    ).subscribe(() => {
      // emit signal
      const signal = new CustomEvent('notebooksupdate', {
        detail: {
          selectedId: this.notebookService.getSelected().id
        }
      });
      window.dispatchEvent(signal);
    });
  }

  private listenLoginEvents() {
    // from host
    this.userService.logged$.subscribe((isLogged) => {
      // emit signal
      const signal = new CustomEvent('userlogged', {
        detail: {
          isLogged,
          user: this.userService.whoami(),
          token: this.userService.getToken()
        }
      });
      window.dispatchEvent(signal);
    });

    // from extension
    window.addEventListener('punditlogin', (ev: CustomEvent) => {
      const { user, token, notebookId } = ev.detail;
      this.userService.iam(user);
      this.userService.setToken(token);
      this.userService.login();
      if (notebookId) {
        this.notebookService.setSelected(notebookId);
      }
    }, false);
  }
}
