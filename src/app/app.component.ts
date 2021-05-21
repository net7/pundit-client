import { Component, ViewEncapsulation } from '@angular/core';
import { NotebookModel } from '../common/models';

@Component({
  selector: 'pnd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
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
