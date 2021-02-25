import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastAction, ToastBox, ToastData } from '../components/toast/toast';

export enum ToastType {
  Log = 'log',
  Warn = 'warning',
  Info = 'info',
  Error = 'error',
}

export interface ToastParams {
  title?: string;
  text?: string;
  hasDismiss?: boolean;
  actions?: ToastAction[];
  onAction?: (payload: any) => void;
}

export interface ToastUpdateParams extends ToastParams {
  type?: ToastType;
}

type EmitFunction = (payload: any) => void;

const DEFAULTS: ToastParams = {
  hasDismiss: true
};

@Injectable()
export class ToastService {
  private toasts: {
    id: string;
    data: ToastBox;
    onAction: EmitFunction;
  }[] = [];

  data$: Subject<ToastData | null> = new Subject();

  log(params: ToastParams) {
    return this.notify(ToastType.Log, params);
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
    if (type !== 'click') {
      return;
    }

    if (payload.action === 'close') {
      this.close(payload.id);
    } else {
      const onActionFunc = this.toasts.find(({ id }) => id === payload.id)?.onAction;
      if (onActionFunc) {
        onActionFunc(payload.action);
      }
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
      },
      onAction: toastParams.onAction
        ? this.getOnAction(toastParams.onAction)
        : null
    });

    // update stream
    this.updateDataStream();

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
    this.toasts.splice(index, 1);

    // update stream
    this.updateDataStream();
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
}
