import { Injectable } from '@angular/core';
import { _t } from '@n7-frontend/core';
import { BehaviorSubject, interval, Subject } from 'rxjs';
import {
  filter, takeWhile, map
} from 'rxjs/operators';
import { ToastAction, ToastBox, ToastData } from '../components/toast/toast';

export enum ToastType {
  Info = 'info',
  Success = 'success',
  Warn = 'warning',
  Error = 'error',
  Working = 'working',
}

export interface ToastParams {
  title?: string;
  text?: string;
  hasDismiss?: boolean;
  actions?: ToastAction[];
  onAction?: (payload: any, instance: ToastInstance) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export interface ToastUpdateParams extends ToastParams {
  type?: ToastType;
}

export type ToastInstance = {
  close: () => void;
  update: (newParams: ToastUpdateParams) => void;
};

type EmitFunction = (payload: any, instance: ToastInstance) => void;

const DEFAULTS: ToastParams = {
  hasDismiss: true,
  autoClose: true,
  autoCloseDelay: 3000 // 3secs
};

@Injectable()
export class ToastService {
  static counter = 0;

  private toasts: {
    id: string;
    data: ToastBox;
    onAction: EmitFunction;
    instance: ToastInstance;
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

  working(text: string = _t('toast#working')) {
    return this.notify(ToastType.Working, {
      text,
      autoClose: false
    });
  }

  componentEmit(type: string, payload: any) {
    switch (type) {
      case 'click': {
        if (payload.action === 'close') {
          this.close(payload.id);
        } else {
          const toast = this.toasts.find(({ id }) => id === payload.id);
          if (toast.onAction) {
            toast.onAction(payload.action, toast.instance);
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
    // updated class counter
    ToastService.counter += 1;
    const toastId = `toast-${ToastService.counter}`;
    const toastParams = {
      ...DEFAULTS,
      ...params
    };
    const instance = {
      close: () => {
        this.close(toastId);
      },
      update: (newParams: ToastUpdateParams) => {
        this.update(toastId, newParams);
      }
    };
    this.toasts.push({
      instance,
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
        progress$: new BehaviorSubject(toastParams.autoClose ? 0 : 100)
      },
      onAction: toastParams.onAction
        ? this.getOnAction(toastParams.onAction)
        : null
    });

    // update stream
    this.updateDataStream();

    // auto close
    this.onAutoClose(toastId, toastParams);

    // return instance
    return instance;
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
      const timerDelay = 200; // ms
      const timer$ = interval(timerDelay);
      const tickCounterLimit = (autoCloseDelay / timerDelay);
      let tickCounter = 0;
      timer$.pipe(
        filter(() => !this.mouseoverState[toastId]),
        map(() => {
          tickCounter += 1;
          return tickCounter;
        }),
        takeWhile((tick) => tick <= tickCounterLimit)
      ).subscribe((tick: number) => {
        const progress = (tick * 100) / tickCounterLimit;
        // update progress
        toast.data.progress$.next(progress);
        // close check
        if (tick === tickCounterLimit) {
          // timeout to complete animation before close
          setTimeout(() => {
            this.close(toastId);
          }, timerDelay * 2);
        }
      });
    }
  }
}
