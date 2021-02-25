import { Injectable } from '@angular/core';
import { interval, Subject } from 'rxjs';
import {
  filter, takeWhile, map
} from 'rxjs/operators';
import { ToastAction, ToastBox, ToastData } from '../components/toast/toast';

export enum ToastType {
  Info = 'info',
  Success = 'success',
  Warn = 'warning',
  Error = 'error',
}

export interface ToastParams {
  title?: string;
  text?: string;
  hasDismiss?: boolean;
  actions?: ToastAction[];
  onAction?: (payload: any) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export interface ToastUpdateParams extends ToastParams {
  type?: ToastType;
}

type EmitFunction = (payload: any) => void;

const DEFAULTS: ToastParams = {
  hasDismiss: true,
  autoClose: true
};

const AUTOCLOSE_DELAY = 5000; // 5secs

@Injectable()
export class ToastService {
  private toasts: {
    id: string;
    data: ToastBox;
    onAction: EmitFunction;
  }[] = [];

  private mouseoverState: {
    [id: string]: boolean;
  } = {};

  data$: Subject<ToastData | null> = new Subject();

  success(params: ToastParams) {
    return this.notify(ToastType.Success, params);
  }

  warn(params: ToastParams) {
    return this.notify(ToastType.Warn, params);
  }

  info(params: ToastParams) {
    return this.notify(ToastType.Info, params);
  }

  error(params: ToastParams) {
    return this.notify(ToastType.Error, params);
  }

  componentEmit(type: string, payload: any) {
    switch (type) {
      case 'click': {
        if (payload.action === 'close') {
          this.close(payload.id);
        } else {
          const onActionFunc = this.toasts.find(({ id }) => id === payload.id)?.onAction;
          if (onActionFunc) {
            onActionFunc(payload.action);
          }
        }
        break;
      }
      case 'mouseover':
        this.mouseoverState[payload] = true;
        break;
      case 'mouseout':
        this.mouseoverState[payload] = false;
        break;
      default:
        break;
    }
  }

  private notify(toastType: ToastType, params: ToastParams) {
    const toastId = `toast-${this.toasts.length}`;
    const toastParams = {
      ...DEFAULTS,
      ...params
    };
    this.toasts.push({
      id: toastId,
      data: {
        classes: this.getDataClasses(toastType),
        title: this.getDataTitle(toastParams.title),
        text: this.getDataText(toastParams.text),
        closeIcon: toastParams.hasDismiss
          ? this.getDataCloseIcon(toastId)
          : null,
        actions: toastParams.actions
          ? this.getDataActions(toastId, toastParams.actions)
          : null,
        _meta: {
          id: toastId
        },
        progress: toastParams.autoClose ? 0 : 100
      },
      onAction: toastParams.onAction
        ? this.getOnAction(toastParams.onAction)
        : null
    });

    // update stream
    this.updateDataStream();

    // auto close
    this.onAutoClose(toastId, toastParams);

    // toast public api
    return {
      close: () => {
        this.close(toastId);
      },
      update: (newParams: ToastUpdateParams) => {
        this.update(toastId, newParams);
      }
    };
  }

  private close(toastId: string) {
    const index = this.toasts.map(({ id }) => id).indexOf(toastId);
    if (index >= 0) {
      // remove toast
      this.toasts.splice(index, 1);
      // remove mouseover state
      delete this.mouseoverState[toastId];
      // update stream
      this.updateDataStream();
    }
  }

  private updateDataStream() {
    this.data$.next({
      toasts: this.toasts.map(({ data }) => data)
    });
  }

  private update(toastId: string, params: ToastUpdateParams) {
    const toast = this.toasts.find(({ id }) => id === toastId);
    if (params.text) {
      toast.data.text = this.getDataText(params.text);
    }
    if (params.title) {
      toast.data.title = this.getDataTitle(params.title);
    }
    if (params.type) {
      toast.data.classes = this.getDataClasses(params.type);
    }
    if (params.actions) {
      toast.data.actions = this.getDataActions(toast.id, params.actions);
    }
    if (params.hasDismiss) {
      toast.data.closeIcon = this.getDataCloseIcon(toast.id);
    }
    if (params.onAction) {
      toast.onAction = this.getOnAction(params.onAction);
    }
  }

  private getDataClasses = (type: ToastType) => `is-${type}`;

  private getDataText = (text: string): string => text;

  private getDataTitle = (title: string): string => title;

  private getDataActions(toastId: string, actions: ToastAction[]): ToastAction[] {
    return actions.map((action) => ({
      ...action,
      payload: {
        id: toastId,
        action: action.payload
      }
    }));
  }

  private getDataCloseIcon(toastId: string): { icon: string; payload: any } {
    return {
      icon: 'pundit-icon-times',
      payload: {
        id: toastId,
        action: 'close'
      },
    };
  }

  private getOnAction(onAction: EmitFunction): EmitFunction {
    return onAction.bind(this);
  }

  // auto close with mouseover check (stop/continue timer)
  private onAutoClose(toastId: string, params: ToastParams) {
    const { autoClose, autoCloseDelay } = params;
    if (autoClose) {
      const toast = this.toasts.find(({ id }) => id === toastId);
      const timerDelay = 10; // ms
      const timer$ = interval(timerDelay);
      const closeDelay = autoCloseDelay || AUTOCLOSE_DELAY;
      const tickCounterLimit = closeDelay / timerDelay;
      let tickCounter = 0;
      timer$.pipe(
        filter(() => !this.mouseoverState[toastId]),
        map(() => {
          tickCounter += 1;
          return tickCounter;
        }),
        takeWhile((tick) => tick <= tickCounterLimit)
      ).subscribe((tick: number) => {
        // update progress
        toast.data.progress = (tick * 100) / tickCounterLimit;
        this.updateDataStream();
        // close check
        if (tick === tickCounterLimit) {
          this.close(toastId);
        }
      });
    }
  }
}
