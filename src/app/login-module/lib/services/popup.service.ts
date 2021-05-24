import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { PopupParameters } from '../interfaces/popup.interface';
import { ModalService } from './modal.service';
@Injectable({
    providedIn: 'root'
})
export class PopupService implements OnDestroy {
    private destroy$: Subject<boolean> = new Subject<boolean>();
    constructor(private modalService: ModalService){}
    ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    open(url, params: PopupParameters, name: string = 'pundit-popup'): Observable<MessageEvent> {
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
        return fromEvent(window, 'message')
            .pipe(
                filter((message: MessageEvent) => this.filterOriginIfExists(message, origin)),
                take(1),
                takeUntil(this.destroy$)
            );
    }

    private filterOriginIfExists = (message: MessageEvent, origin?: string) => {
        return !origin || message.origin === origin;
    }
}
