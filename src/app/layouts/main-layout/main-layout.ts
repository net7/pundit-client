import {
  Component, OnInit, OnDestroy
} from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { MainLayoutConfig as config } from './main-layout.config';

export type LayoutEvent = {
  type: string;
  payload?: any;
}

@Component({
  selector: 'main-layout',
  templateUrl: './main-layout.html'
})
export class MainLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  public layoutEvent$: ReplaySubject<LayoutEvent> = new ReplaySubject();

  constructor(
    private userService: UserService,
    private notebookService: NotebookService,
    private annotationService: AnnotationService,
  ) {
    super(config);

    // FIXME: prendere utente defintivo
    this.userService.iam({
      id: '12345',
      username: 'johndoe',
      thumb: 'https://placeimg.com/400/600/people'
    });

    // FIXME: prendere default notebook
    this.notebookService.setSelected('123456');
  }

  protected initPayload() {
    return {
      layoutEvent$: this.layoutEvent$,
      userService: this.userService,
      notebookService: this.notebookService,
      annotationService: this.annotationService,
    };
  }

  ngOnInit() {
    this.onInit();
  }

  ngOnDestroy() {
    this.onDestroy();
  }
}
