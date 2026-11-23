import { ComponentFixture, TestBed } from '@angular/core/testing';
import { translate } from '@net7/core';
import { BehaviorSubject, Subject } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { ReplyService } from 'src/app/services/reply.service';
import { SocialService, SocialStats } from 'src/app/services/social.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserService } from 'src/app/services/user.service';
import { Reply } from 'src/communication';
import { SocialActionBarComponent } from './social-action-bar';

const ANNOTATION_ID = '01HXYZ5D7Q8R9S0T1V2W3X4Y5Z';

describe('SocialActionBarComponent reply', () => {
  let fixture: ComponentFixture<SocialActionBarComponent>;
  let el: HTMLElement;
  let replies$: BehaviorSubject<Reply[]>;
  let save$: Subject<unknown>;
  let replyService: { create: jest.Mock };

  const replyCount = () => el.querySelector('.pnd-annotation__social-bar-action > span')?.textContent;
  const textarea = () => el.querySelector<HTMLTextAreaElement>('textarea.pnd-annotation__reply-textarea');

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    translate.setLangTranslations('en', en_US);
  });

  beforeEach(() => {
    replies$ = new BehaviorSubject<Reply[]>([]);
    save$ = new Subject();
    replyService = { create: jest.fn(() => save$) };
    TestBed.configureTestingModule({
      imports: [SocialActionBarComponent],
      providers: [
        { provide: UserService, useValue: { logged$: new BehaviorSubject(true), whoami: () => ({ id: 'u1' }) } },
        { provide: PunditLoginService, useValue: { start: jest.fn() } },
        { provide: SocialService, useValue: { create: jest.fn(), remove: jest.fn() } },
        { provide: ReplyService, useValue: replyService },
        { provide: ToastService, useValue: { success: jest.fn(), error: jest.fn() } },
      ],
    });
    fixture = TestBed.createComponent(SocialActionBarComponent);
    fixture.componentRef.setInput('socials$', new BehaviorSubject({} as SocialStats));
    fixture.componentRef.setInput('replies$', replies$);
    fixture.componentRef.setInput('annotationId', ANNOTATION_ID);
    fixture.componentRef.setInput('emit', jest.fn());
    fixture.componentRef.setInput('actions', ['Reply']);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('opens the reply form of an annotation whose id starts with a digit', () => {
    el.querySelector<HTMLElement>('.pnd-annotation__social-bar-action')!.click();
    fixture.detectChanges();

    expect(textarea()?.id).toBe(ANNOTATION_ID);
  });

  it('closes the form and moves the count once the save completes', async () => {
    el.querySelector<HTMLElement>('.pnd-annotation__social-bar-action')!.click();
    fixture.componentInstance.onReplyChange('a valid reply');
    fixture.detectChanges();
    expect(textarea()).not.toBeNull();

    fixture.componentInstance.onReplyFormAction('save');
    expect(replyService.create).toHaveBeenCalledWith(expect.objectContaining({
      annotationId: ANNOTATION_ID, comment: 'a valid reply',
    }));

    // the save answers later, outside any template event
    await Promise.resolve();
    save$.next({ data: { id: '01HXREPLY' } });
    save$.complete();
    replies$.next([{ id: '01HXREPLY', userId: 'u1' } as Reply]);
    fixture.detectChanges();

    expect(textarea()).toBeNull();
    expect(replyCount()).toBe('1');
  });
});
