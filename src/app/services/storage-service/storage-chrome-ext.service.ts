import { Injectable } from '@angular/core';
import { ConnectableObservable, Observable } from 'rxjs';
import { publish, tap } from 'rxjs/operators';
import { StorageKey, StorageProvider, StorageValue } from './storage.types';

enum OperationType {
  Get = 'get',
  Set = 'set',
  Remove = 'remove'
}

@Injectable()
export class StorageChromeExtService implements StorageProvider {
  private queue$: ConnectableObservable<StorageValue>[] = [];

  public set(key: StorageKey, value: string): void {
    this.message$(OperationType.Set, key, value).subscribe(() => {
      // do nothing
    });
  }

  public get(key: StorageKey): Observable<StorageValue> {
    return this.message$(OperationType.Get, key);
  }

  public remove(key: StorageKey) {
    this.message$(OperationType.Remove, key).subscribe(() => {
      // do nothing
    });
  }

  private message$(
    operation: OperationType,
    key: StorageKey,
    value?: string
  ): Observable<StorageValue> {
    const task$ = new Observable<StorageValue>((subscriber) => {
      // listen signal from chrome-ext
      window.addEventListener('storage.response', (ev: CustomEvent) => {
        const { status, data } = ev.detail;
        if (status === 'KO') {
          subscriber.error(`Storage error: operation ${operation} - key: ${key}`);
        }
        subscriber.next(data);
        subscriber.complete();
      }, { once: true });

      // emit signal to chrome-ext
      const signal = new CustomEvent('storage.request', {
        detail: { operation, key, value }
      });
      window.dispatchEvent(signal);
    });

    const queuedTask$ = publish<StorageValue>()(task$.pipe(
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
