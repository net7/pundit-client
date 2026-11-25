import { Injectable } from '@angular/core';
import { _t } from '@net7/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment as env } from 'src/environments/environment';
import { ClientStatusModel } from 'src/common/models';
import { crossMessageEnabled } from 'src/common/cross-message';
import {
  MaintenanceNotice, ParsedClientStatus, noticeApplies, parseClientStatus
} from '../helpers/client-status.helper';
import { getClientVersion } from '../helpers/client-version.helper';

/** A read younger than this is reused. */
const CACHE_MS = 60 * 1000;
/** Periodic read, skipped while the page is hidden. */
const POLL_MS = 5 * 60 * 1000;
/**
 * Page-side limit of a read: the model aborts after 3 s, but a message relayed to the
 * extension's background could never come back.
 */
const READ_TIMEOUT_MS = 3500;

/** `label` is the short status in the sidebar header. */
export type MaintenanceTexts = { label: string; title: string; text: string };

/**
 * The maintenance notice the server switches on and off (GET <APP_URL>/api/client-status).
 *
 * While a notice applies the app shows it in place of Pundit, which is not started: no API
 * call, no action. A failed read keeps the last valid status of this page session; without one
 * there is no notice.
 * Nothing here throws: the status can never break the client.
 */
@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  /** The notice that applies to this client, or null. Emits only on change. */
  readonly notice$ = new BehaviorSubject<MaintenanceNotice | null>(null);

  /** Title and text of the notice that applies, or null. */
  readonly texts$: Observable<MaintenanceTexts | null> = this.notice$.pipe(
    map((notice) => (notice ? this.texts(notice) : null))
  );

  private lastValid: ParsedClientStatus | null = null;

  private lastReadAt = 0;

  private reading: Promise<void> | null = null;

  private firstRead: Promise<void> | null = null;

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  private onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.refresh();
    }
  };

  /** Whether a status URL is configured (in the extension, the background has its own). */
  enabled(): boolean {
    return crossMessageEnabled() || !!(env as { statusUrl?: string }).statusUrl;
  }

  /** First read, then every 5 minutes and when the page becomes visible. Idempotent. */
  start(): void {
    if (this.firstRead) return;
    if (!this.enabled()) {
      this.firstRead = Promise.resolve();
      return;
    }
    this.firstRead = this.refresh(true);
    this.pollTimer = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        this.refresh();
      }
    }, POLL_MS);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** Resolves after the first read, whatever its outcome (at most ~3.5 s). */
  ready(): Promise<void> {
    return this.firstRead || Promise.resolve();
  }

  /** Reads the status, reusing a read younger than 60 s unless forced. Never rejects. */
  refresh(force = false): Promise<void> {
    if (!this.enabled()) return Promise.resolve();
    if (this.reading) return this.reading;
    if (!force && Date.now() - this.lastReadAt < CACHE_MS) return Promise.resolve();
    this.reading = this.read().finally(() => {
      this.reading = null;
    });
    return this.reading;
  }

  /**
   * The words of a notice: maintenance, or, for a client the notice targets by version, an
   * update request (extension) or a reload request (other builds).
   */
  texts(notice: MaintenanceNotice): MaintenanceTexts {
    let key = 'maintenance#';
    if (notice.outdated) {
      key = env.chromeExt ? 'maintenance#outdated_ext_' : 'maintenance#outdated_embed_';
    }
    return { label: _t(`${key}label`), title: _t(`${key}title`), text: _t(`${key}text`) };
  }

  private async read(): Promise<void> {
    let json: unknown;
    try {
      json = await this.withTimeout(
        ClientStatusModel.get((env as { statusUrl?: string }).statusUrl || null)
      );
    } catch {
      json = null;
    }
    this.lastReadAt = Date.now();
    const status = parseClientStatus(json);
    if (status) {
      this.lastValid = status;
    }
    this.emit(this.evaluate());
  }

  private evaluate(): MaintenanceNotice | null {
    if (!this.lastValid) return null;
    const clientVersion = getClientVersion();
    for (const notice of this.lastValid.notices) {
      const applying = noticeApplies(notice, clientVersion);
      if (applying) return applying;
    }
    return null;
  }

  private emit(notice: MaintenanceNotice | null): void {
    const current = this.notice$.value;
    const same = notice === current || (
      !!notice && !!current && notice.id === current.id && notice.outdated === current.outdated
    );
    if (!same) {
      this.notice$.next(notice);
    }
  }

  private withTimeout<T>(request: Promise<T>): Promise<T | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), READ_TIMEOUT_MS);
      request.then(
        (value) => { clearTimeout(timer); resolve(value); },
        () => { clearTimeout(timer); resolve(null); }
      );
    });
  }
}
