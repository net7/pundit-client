import { TestBed } from '@angular/core/testing';
import { translate } from '@net7/core';
import en_US from 'src/app/config/i18n/en_US';
import { environment as env } from 'src/environments/environment';
import { MaintenanceService, MaintenanceTexts } from 'src/app/services/maintenance.service';
import { ToastService } from 'src/app/services/toast.service';
import { SIDEBAR_EXPANDED_CLASS } from 'src/app/layouts/main-layout/handlers';
import { MaintenanceNoticeComponent } from './maintenance-notice';

translate.init({ defaultLang: 'en_US', translations: { en_US } });

describe('MaintenanceNoticeComponent', () => {
  const textsOf = (outdated: boolean) => TestBed.inject(MaintenanceService)
    .texts({ id: 'maintenance', outdated });

  const render = (texts: () => MaintenanceTexts | null) => {
    TestBed.configureTestingModule({ imports: [MaintenanceNoticeComponent] });
    const fixture = TestBed.createComponent(MaintenanceNoticeComponent);
    fixture.componentRef.setInput('data', texts());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, toast: TestBed.inject(ToastService) };
  };

  beforeEach(() => {
    // the toast appears on a timer and closes on an interval
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    (env as { chromeExt: boolean }).chromeExt = false;
    document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
  });

  it('renders nothing without a notice', () => {
    const { el } = render(() => null);
    expect(el.querySelector('.pnd-sidebar')).toBeNull();
  });

  it('shows the notice in an expanded Pundit sidebar, as an alert without a close button', () => {
    const { el } = render(() => textsOf(false));
    expect(el.querySelector('.pnd-sidebar.is-expanded')).not.toBeNull();
    const notice = el.querySelector('.pnd-sidebar__content .pnd-maintenance-notice')!;
    expect(notice.getAttribute('role')).toBe('alert');
    expect(notice.textContent).toContain('Pundit is under maintenance');
    expect(notice.querySelector('button')).toBeNull();
    expect(document.body.classList.contains(SIDEBAR_EXPANDED_CLASS)).toBe(true);
  });

  it('shows the status in the header, with Pundit\'s actions disabled', () => {
    const { el } = render(() => textsOf(false));
    expect(el.querySelector('.pnd-maintenance-status')!.textContent).toContain('Maintenance');
    const disabled = el.querySelectorAll('.pnd-sidebar__action.is-disabled');
    expect(disabled).toHaveLength(3);
    disabled.forEach((action) => {
      expect(action.getAttribute('aria-disabled')).toBe('true');
      expect(action.getAttribute('title')).toBe('Not available right now');
    });
  });

  it('closes from the header button', () => {
    const { fixture, el } = render(() => textsOf(false));
    (el.querySelector('.pnd-sidebar__close-button') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.pnd-sidebar.is-collapsed')).not.toBeNull();
  });

  it('shows the notice in a toast too', () => {
    const { fixture, el } = render(() => textsOf(false));
    jest.advanceTimersByTime(0);
    fixture.detectChanges();
    const toast = el.querySelector('.pnd-toast__box.is-warning')!;
    expect(toast.textContent).toContain('Pundit is under maintenance');
    expect(toast.textContent).toContain('Annotations are not available for now.');
  });

  it('collapses from the logo, with a dot that names the notice', () => {
    const { fixture, el } = render(() => textsOf(false));

    (el.querySelector('.pnd-sidebar__logo') as HTMLElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.pnd-sidebar.is-collapsed')).not.toBeNull();
    expect(el.querySelector('.pnd-maintenance-notice')).toBeNull();
    expect(el.querySelector('.pnd-sidebar__logo-dot')!.getAttribute('aria-label'))
      .toBe('Pundit is under maintenance');
    expect(document.body.classList.contains(SIDEBAR_EXPANDED_CLASS)).toBe(false);
  });

  it('closes the toast and frees the page when destroyed', () => {
    const { fixture, toast } = render(() => textsOf(false));
    const clear = jest.spyOn(toast, 'clear');

    fixture.destroy();

    expect(clear).toHaveBeenCalled();
    expect(document.body.classList.contains(SIDEBAR_EXPANDED_CLASS)).toBe(false);
  });

  it('asks an outdated extension to update', () => {
    (env as { chromeExt: boolean }).chromeExt = true;
    const { el } = render(() => textsOf(true));
    expect(el.querySelector('.pnd-maintenance-notice')!.textContent).toContain('Update Pundit');
    expect(el.querySelector('.pnd-maintenance-status')!.textContent).toContain('Update required');
    expect(el.querySelector('.pnd-maintenance-notice')!.textContent)
      .toContain('as soon as it is available');
  });

  it('asks an outdated embed to reload the page', () => {
    const { el } = render(() => textsOf(true));
    expect(el.querySelector('.pnd-maintenance-notice')!.textContent)
      .toContain('Reload the page to keep annotating.');
  });
});
