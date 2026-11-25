import {
  Component, ViewEncapsulation, ChangeDetectionStrategy, OnDestroy, inject
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, pairwise } from 'rxjs/operators';
import { NotebookModel } from '../common/models';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SIDEBAR_EXPANDED_CLASS } from './layouts/main-layout/handlers';
import { MaintenanceNoticeComponent } from './components/maintenance-notice/maintenance-notice';
import { MaintenanceService } from './services/maintenance.service';
import { AnchorService } from './services/anchor.service';
import { AnnotationService } from './services/annotation.service';
import { ToastService } from './services/toast.service';
import { tooltipModel } from './models/tooltip-model';

@Component({
    selector: 'pnd-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MainLayoutComponent, MaintenanceNoticeComponent, AsyncPipe]
})
export class AppComponent implements OnDestroy {
  private maintenanceService = inject(MaintenanceService);
  private anchorService = inject(AnchorService);
  private annotationService = inject(AnnotationService);
  private toastService = inject(ToastService);

  /**
   * Pundit starts after the first maintenance status read (at most ~3.5 s), so that it makes
   * no API call during a maintenance. Without a status URL it starts at once, as before.
   */
  readonly ready$ = new BehaviorSubject(!this.maintenanceService.enabled());

  /** Words of the maintenance notice: while set, Pundit is not started. */
  readonly maintenance$ = this.maintenanceService.texts$;

  private subscription: Subscription;

  constructor() {
    this.maintenanceService.start();
    this.maintenanceService.ready().then(() => this.ready$.next(true));
    // a notice switched on during a session: Pundit stops, remove what it left on the page
    this.subscription = this.maintenanceService.notice$.pipe(
      pairwise(),
      filter(([previous, current]) => !previous && !!current),
    ).subscribe(() => this.clearPage());

    // this.deleteNotebooksFromList(
    //   []
    // );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.maintenanceService.stop();
  }

  private clearPage() {
    tooltipModel.hide();
    this.toastService.clear();
    this.anchorService.removeAll();
    this.annotationService.clear();
    document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
  }

  /**
   * ⚠ DEVELOPMENT ONLY!!
   *
   * Removes all notebooks passed as the argument.
   * @param notebooks list of notebook id's
   *
   * FIXME: Remove this function in production.
   */
  deleteNotebooksFromList(notebooks: string[]) {
    Promise.all(
      notebooks.map((id) => NotebookModel.remove(id))
    ).then((res) => {
      // eslint-disable-next-line no-console
      console.log('notebooks deleted', res);
    }).catch((err) => {
      console.warn(err);
    });
  }
}
