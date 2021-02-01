import { Injectable } from '@angular/core';
import { config } from '../models/config';
import { AnchorService } from './anchor.service';
import { AnnotationService } from './annotation.service';
import { UserService } from './user.service';

@Injectable()
export class ChromeExtService {
  constructor(
    private anchorService: AnchorService,
    private annotationService: AnnotationService,
    private userService: UserService,
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
        this.addFontStyles();
        this.listenExtensionEvents();
        this.listenAnnotationUpdates();
        this.listenLoginEvents();
        res();
      }, false);
    });
  }

  private addFontStyles() {
    const chromeExtUrl = config.get('chromeExtUrl');

    // add style to document
    const style = document.createElement('style');
    style.innerHTML = `@import "${chromeExtUrl}/n7-icon/style.css";`;
    document.head.appendChild(style);
  }

  private listenExtensionEvents() {
    // destroy
    window.addEventListener('punditdestroy', async () => {
      this.anchorService.removeAll();
    }, false);
  }

  private listenAnnotationUpdates() {
    this.annotationService.totalChanged$.subscribe((number) => {
      // emit signal
      const signal = new CustomEvent('annotationsupdate', { detail: { total: number } });
      window.dispatchEvent(signal);
    });
  }

  private listenLoginEvents() {
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

    // login from memory
    window.addEventListener('punditlogin', (ev: CustomEvent) => {
      const { user, token } = ev.detail;
      this.userService.iam(user);
      this.userService.setToken(token);
      this.userService.login();
    }, false);
  }
}
