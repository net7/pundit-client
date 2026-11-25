import {
  Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, inject
} from '@angular/core';
import { NgClass, AsyncPipe } from '@angular/common';
import { _t } from '@net7/core';
import { MaintenanceTexts } from 'src/app/services/maintenance.service';
import { ToastService } from 'src/app/services/toast.service';
import { SIDEBAR_EXPANDED_CLASS } from 'src/app/layouts/main-layout/handlers';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { ToastComponent } from '../toast/toast';

/** The toast closes on its own after this delay. */
const TOAST_DELAY = 10000;

/**
 * Shown in place of Pundit while a maintenance notice applies: a Pundit sidebar with only the
 * notice in it, and a toast with the same words. The sidebar opens and closes from the logo,
 * like Pundit's, and pushes the page aside the same way. Never dismissible: it lasts as long
 * as the notice.
 */
@Component({
  selector: 'pnd-maintenance-notice',
  templateUrl: './maintenance-notice.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, AsyncPipe, SvgIconComponent, ToastComponent],
})
export class MaintenanceNoticeComponent implements OnInit, OnDestroy {
  toastService = inject(ToastService);

  private changeDetectorRef = inject(ChangeDetectorRef);

  @Input() data: MaintenanceTexts | null = null;

  collapsed = false;

  readonly labels = {
    collapse: _t('sidebaractions#collapse'),
    unavailable: _t('maintenance#unavailable'),
  };

  /** Pundit's header actions, shown disabled so the sidebar looks like Pundit's. */
  readonly unavailableActions = ['full-page', 'book', 'ontologies'];

  ngOnInit() {
    // the toast service refreshes the view of whoever shows its toasts
    ToastService.changeDetectorRef = this.changeDetectorRef;
    this.updateBodyClass();
    if (this.data) {
      this.toastService.warn({
        title: this.data.title,
        text: this.data.text,
        autoCloseDelay: TOAST_DELAY,
      });
    }
  }

  ngOnDestroy() {
    this.toastService.clear();
    document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
  }

  toggle() {
    this.collapsed = !this.collapsed;
    this.updateBodyClass();
  }

  onToastEmit = (type: string, payload: unknown) => {
    this.toastService.componentEmit(type, payload);
  };

  private updateBodyClass() {
    document.body.classList.toggle(SIDEBAR_EXPANDED_CLASS, !this.collapsed);
  }
}
