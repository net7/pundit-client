import { Injectable } from '@angular/core';
import { ConnectableObservable, Observable } from 'rxjs';
import { publish, tap } from 'rxjs/operators';
import { CommonEventType, StorageKey, StorageOperationType } from '../../../common/types';
import { StorageProvider, StorageValue } from './storage.types';

@Injectable()
export class StorageChromeExtService implements StorageProvider {
  private queue$: ConnectableObservable<StorageValue | boolean>[] = [];

  public set(key: StorageKey, value: string): Observable<boolean> {
    return this.message$(StorageOperationType.Set, key, value) as Observable<boolean>;
  }

  public get(key: StorageKey): Observable<StorageValue> {
    return this.message$(StorageOperationType.Get, key) as Observable<StorageValue>;
  }

  public remove(key: StorageKey): Observable<boolean> {
    return this.message$(StorageOperationType.Remove, key) as Observable<boolean>;
  }

  private message$(
    operation: StorageOperationType,
    key: StorageKey,
    value?: string
  ): Observable<StorageValue | boolean> {
    const task$ = new Observable<StorageValue | boolean>((subscriber) => {
      // listen signal from chrome-ext
      window.addEventListener(CommonEventType.StorageResponse, (ev: CustomEvent) => {
        const { status, data } = ev.detail;
        if (status === 'KO') {
          subscriber.error(`Storage error: operation ${operation} - key: ${key}`);
        }
        if (operation === StorageOperationType.Get) {
          subscriber.next(data);
        } else {
          subscriber.next(true);
        }
        subscriber.complete();
      }, { once: true });

      // emit signal to chrome-ext
      const signal = new CustomEvent(CommonEventType.StorageRequest, {
        detail: { operation, key, value }
      });
      window.dispatchEvent(signal);
    });

    const queuedTask$ = publish<StorageValue | boolean>()(task$.pipe(
      tap(() => {
        // remove first from queue
        this.queue$.shift();
        // call next task from queue
        if (this.queue$[0]) {
          this.queue$[0].connect();
        }
      })
    ));
    // add to queue
    this.queue$.push(queuedTask$);

    // if there is no queue trigger first task
    if (this.queue$.length === 1) {
      this.queue$[0].connect();
    }
    return queuedTask$;
  }
}
