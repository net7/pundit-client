import { Component } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { translate } from '@net7/core';
import { BehaviorSubject, Subject } from 'rxjs';
import en_US from './config/i18n/en_US';
import { map } from 'rxjs/operators';
import { AppComponent } from './app.component';
import { MaintenanceService } from './services/maintenance.service';
import { AnchorService } from './services/anchor.service';
import { AnnotationService } from './services/annotation.service';
import { ToastService } from './services/toast.service';
import { SIDEBAR_EXPANDED_CLASS } from './layouts/main-layout/handlers';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';

@Component({
  selector: 'main-layout',
  template: '',
  standalone: true
})
class MainLayoutStubComponent {}

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppComponent
      ],
    })
      .overrideComponent(AppComponent, {
        remove: { imports: [MainLayoutComponent] },
        add: { imports: [MainLayoutStubComponent] }
      })
      .compileComponents();
  // compiling the component compiles the whole stylesheet: slow under a full parallel run
  }), 30000);

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

translate.init({ defaultLang: 'en_US', translations: { en_US } });

describe('AppComponent > maintenance notice', () => {
  const NOTICE = { id: 'maintenance', outdated: false };
  const TEXTS = { title: 'Pundit is under maintenance', text: 'Try again later.' };

  const setup = (enabled: boolean) => {
    let resolveReady: () => void = () => undefined;
    const notice$ = new BehaviorSubject<typeof NOTICE | null>(null);
    const maintenance = {
      notice$,
      texts$: notice$.pipe(map((notice) => (notice ? TEXTS : null))),
      enabled: () => enabled,
      start: jest.fn(),
      stop: jest.fn(),
      ready: () => new Promise<void>((res) => { resolveReady = res; }),
    };
    const anchorService = { removeAll: jest.fn() };
    const annotationService = { clear: jest.fn() };
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: MaintenanceService, useValue: maintenance },
        { provide: AnchorService, useValue: anchorService },
        { provide: AnnotationService, useValue: annotationService },
        {
          provide: ToastService,
          useValue: { warn: jest.fn(), clear: jest.fn(), componentEmit: jest.fn(), data$: new Subject() },
        },
      ],
    }).overrideComponent(AppComponent, {
      remove: { imports: [MainLayoutComponent] },
      add: { imports: [MainLayoutStubComponent] }
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const root = () => fixture.nativeElement.shadowRoot as ShadowRoot;
    const render = async () => {
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return {
      fixture, maintenance, anchorService, annotationService, root, render,
      resolveReady: () => resolveReady(),
    };
  };

  it('starts Pundit at once without a status URL', () => {
    const { root, maintenance } = setup(false);
    expect(maintenance.start).toHaveBeenCalled();
    expect(root().querySelector('main-layout')).not.toBeNull();
  });

  it('starts Pundit after the first status read', async () => {
    const { root, render, resolveReady } = setup(true);
    expect(root().querySelector('main-layout')).toBeNull();

    resolveReady();
    await render();

    expect(root().querySelector('main-layout')).not.toBeNull();
    expect(root().querySelector('.pnd-maintenance-notice')).toBeNull();
  });

  it('shows the notice in place of Pundit while it applies', async () => {
    const { root, render, resolveReady, maintenance } = setup(true);
    maintenance.notice$.next(NOTICE);
    resolveReady();
    await render();

    expect(root().querySelector('main-layout')).toBeNull();
    expect(root().querySelector('.pnd-maintenance-notice')!.textContent).toContain(TEXTS.title);
  });

  it('stops Pundit and clears the page when a notice is switched on', async () => {
    const { root, render, resolveReady, maintenance, anchorService, annotationService } = setup(true);
    resolveReady();
    await render();

    maintenance.notice$.next(NOTICE);
    await render();

    expect(root().querySelector('main-layout')).toBeNull();
    expect(root().querySelector('.pnd-maintenance-notice')).not.toBeNull();
    expect(anchorService.removeAll).toHaveBeenCalled();
    expect(annotationService.clear).toHaveBeenCalled();
    expect(TestBed.inject(ToastService).clear).toHaveBeenCalled();
  });

  it('leaves the page as Pundit would when the notice is switched off', async () => {
    const { render, resolveReady, maintenance } = setup(true);
    maintenance.notice$.next(NOTICE);
    resolveReady();
    await render();
    expect(document.body.classList.contains(SIDEBAR_EXPANDED_CLASS)).toBe(true);

    maintenance.notice$.next(null);
    await render();

    // the notice's sidebar is gone; Pundit's own sidebar sets the class again when it opens
    expect(document.body.classList.contains(SIDEBAR_EXPANDED_CLASS)).toBe(false);
  });

  it('starts Pundit again when the notice is switched off', async () => {
    const { root, render, resolveReady, maintenance } = setup(true);
    maintenance.notice$.next(NOTICE);
    resolveReady();
    await render();

    maintenance.notice$.next(null);
    await render();

    expect(root().querySelector('main-layout')).not.toBeNull();
    expect(root().querySelector('.pnd-maintenance-notice')).toBeNull();
  });
});
