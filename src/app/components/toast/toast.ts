//---------------------------
// TOAST.ts
//---------------------------

import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Interface for ToastComponent's "data"
 *
 * @property toasts (required)
 * @property classes (optional)
 */

export interface ToastData { // toast column wrapper
  toasts: ToastBox[];
  classes?: string;
}

/**
 * Interface for the single ToastComponent's "Box"
 *
 * @property classes (required)
 * @property timer (optional)
 * @property closeIcon (optional)
 * - icon (required)
 * - payload (required)
 * @property title (optional)
 * @property text (optional)
 * @property actions (optional)
 */

export interface ToastBox {
  /**
   * requires: [is-success, is-warning, is-error] + optional additional html classes
   */
  classes: string;
  /**
   * larger, title text
   */
  title?: string;
  /**
   * the toast's body text
   */
  text?: string;
  /**
   * 'X' icon, to dismiss/close the toast
   * ( n7-icon-cross )
   *
   *  Each icon requires it's onClick payload
   */
  closeIcon?: {
    icon: string;
    payload: any;
  };
  /**
   * the toast's optional buttons
   * suggestion: don't use more than 2 actions
   */
  actions?: ToastAction[];
  /**
   * progress bar
   */
  progress$?: BehaviorSubject<number>;
  /**
   * additional info
   */
  _meta?: any;
}

/**
 * Interface for the single ToastComponent's "Action"
 *
 * @property text (required)
 * @property payload (required)
 * @property classes (optional)
 */

export interface ToastAction {
  /**
   * the button's rendered text
   */
  text: string;
  /**
   * the button's onClick payload
   */
  payload: any;
  /**
   * additional html classes
   */
  classes?: string;
}

@Component({
  selector: 'pnd-toast',
  templateUrl: './toast.html'
})
export class ToastComponent {
  @Input() data: ToastData;

  @Input() emit: any;

  onClick(payload) {
    if (!this.emit) return;

    this.emit('click', payload);
  }

  onMouseover(payload) {
    this.emit('mouseover', payload);
  }

  onMouseout(payload) {
    this.emit('mouseout', payload);
  }
}
