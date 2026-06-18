import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ModalComponent } from '../login-module/lib/components/modal/modal.component';
import { SignInComponent } from '../login-module/lib/components/signin/signin.component';
import { SignUpComponent } from '../login-module/lib/components/signup/signup.component';
import { ErrorComponent } from '../login-module/lib/components/error/error.component';
import { ModalService } from '../login-module/lib/services/modal.service';
import { EmailProviderService } from '../login-module/lib/services/email-provider.service';
import { OauthProviderService } from '../login-module/lib/services/oauth-provider.service';
import { TooltipComponent } from './tooltip/tooltip';

const authConfig = {
  oauthproviders: [
    { id: 'google', type: 'OAuth', params: {}, popup: {} },
    { id: 'facebook', type: 'OAuth', params: {}, popup: {} },
    { id: 'egi', type: 'OAuth', params: {}, popup: {} }
  ],
  email: { id: 'default', register: true, type: 'email' },
  terms: { url: 'terms', popup: { origin: '' } }
};

describe('OnPush leaf component smoke tests', () => {
  let isLoading$: Subject<boolean>;
  let error$: Subject<object>;

  beforeEach(() => {
    isLoading$ = new Subject<boolean>();
    error$ = new Subject<object>();

    TestBed.configureTestingModule({
      imports: [
        ErrorComponent,
        ModalComponent,
        SignInComponent,
        SignUpComponent,
        TooltipComponent
      ],
      providers: [
        ModalService,
        { provide: 'config', useValue: authConfig },
        {
          provide: EmailProviderService,
          useValue: {
            isLoading$,
            error$,
            login: jest.fn(),
            register: jest.fn()
          }
        },
        { provide: OauthProviderService, useValue: { login: jest.fn() } }
      ]
    })
      .overrideComponent(ModalComponent, {
        set: { template: '<span class="state">{{ show }}:{{ status }}</span>' }
      })
      .overrideComponent(SignInComponent, {
        set: { template: '<span class="loading">{{ isLoading }}</span><span class="error">{{ serviceErrorMessage }}</span>' }
      })
      .overrideComponent(SignUpComponent, {
        set: { template: '<span class="loading">{{ isLoading }}</span><span class="error">{{ serviceErrorMessage }}</span>' }
      })
      .overrideComponent(ErrorComponent, {
        set: { template: '<span>{{ errorTitle }}</span>' }
      })
      .overrideComponent(TooltipComponent, {
        set: { template: '<button class="tooltip-action" (click)="navEmit(\'click\', data.navData.items[0].anchor.payload)">{{ data.navData.items[0].text }}</button>' }
      });
  });

  it('updates the login modal when the modal service opens registration', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    const modalService = TestBed.inject(ModalService);

    fixture.detectChanges();
    modalService.open(true);
    fixture.detectChanges();

    expect(text(fixture, '.state')).toBe('true:SIGNUP');
  });

  it('updates sign-in loading state from the email provider stream', () => {
    const fixture = TestBed.createComponent(SignInComponent);

    fixture.detectChanges();
    isLoading$.next(true);
    fixture.detectChanges();

    expect(text(fixture, '.loading')).toBe('true');
  });

  it('updates sign-up loading state from the email provider stream', () => {
    const fixture = TestBed.createComponent(SignUpComponent);

    fixture.detectChanges();
    isLoading$.next(true);
    fixture.detectChanges();

    expect(text(fixture, '.loading')).toBe('true');
  });

  it('creates the static login error leaf component', () => {
    const fixture = TestBed.createComponent(ErrorComponent);
    fixture.componentInstance.errorTitle = 'Error title';
    fixture.detectChanges();

    expect(text(fixture, 'span')).toBe('Error title');
  });

  it('renders tooltip input data and emits nav actions', () => {
    const fixture = TestBed.createComponent(TooltipComponent);
    const emit = jest.fn();
    fixture.componentInstance.data = {
      visible: true,
      navData: {
        items: [{
          text: 'Annotate',
          anchor: { payload: 'comment' }
        }]
      }
    } as any;
    fixture.componentInstance.emit = emit;

    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.tooltip-action') as HTMLButtonElement).click();

    expect(text(fixture, '.tooltip-action')).toBe('Annotate');
    expect(emit).toHaveBeenCalledWith('click', 'comment');
  });
});

function text<T>(fixture: ComponentFixture<T>, selector: string): string {
  return (fixture.nativeElement.querySelector(selector) as HTMLElement).textContent!.trim();
}
