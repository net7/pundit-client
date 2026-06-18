import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { NotebookModel } from '../common/models';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';

@Component({
    selector: 'pnd-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MainLayoutComponent]
})
export class AppComponent {
  constructor() {
    // this.deleteNotebooksFromList(
    //   []
    // );
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
