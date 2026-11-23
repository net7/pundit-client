import { Injectable, OnDestroy, inject } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { POPUP_MESSAGE_SOURCE } from '../helpers/transformer.helper';
import { PopupParameters } from '../interfaces/popup.interface';
import { ModalService } from './modal.service';

@Injectable({
  providedIn: 'root'
})
export class PopupService implements OnDestroy {
  private modalService = inject(ModalService);

  private destroy$: Subject<boolean> = new Subject<boolean>();

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  open(url: string, params: PopupParameters, name = 'pundit-popup'): Observable<MessageEvent> {
    const size = params.size || { height: '400', width: '400' };
    const sizeStr = `height=${size.height},width=${size.width}`;
    window.open(url, name, sizeStr);
    this.modalService.close();
    return this.listenEvent(params.origin);
  }

  private listenEvent(origin?: string): Observable<MessageEvent> {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.destroy$ = new Subject<boolean>();
    return fromEvent<MessageEvent>(window, 'message')
      .pipe(
        filter((message: MessageEvent) => this.isPopupMessage(message, origin)),
        take(1),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Only the outcome message posted by the application's own popup is read:
   * in the extension the page can receive messages from any origin.
   */
  private isPopupMessage = (
    message: MessageEvent,
    origin?: string
  ) => !!origin
    && message.origin === origin
    && message.data?.source === POPUP_MESSAGE_SOURCE;
}
