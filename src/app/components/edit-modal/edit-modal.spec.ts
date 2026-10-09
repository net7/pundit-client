import { TestBed } from '@angular/core/testing';
import { EditModalEvent, getEventType } from 'src/app/event-types';
import { aiPreviewState$, EditModalComponent } from './edit-modal';

describe('EditModalComponent > AI Generate button', () => {
  let component: EditModalComponent;
  let emit: jest.Mock;

  const setAiRequest = (prompt: string, annotationType = 'comment') => {
    (component as any).formState = { aiRequest: { value: { prompt, annotationType } } };
  };

  beforeEach(() => {
    component = TestBed.createComponent(EditModalComponent).componentInstance;
    emit = jest.fn();
    component.emit = emit;
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('is disabled after generating with the same prompt and type', () => {
    setAiRequest('find names');
    expect(component.disableGenerate).toBe(false);

    component.onGenerate();

    expect(emit).toHaveBeenCalledWith(getEventType(EditModalEvent.AiGenerate), {
      prompt: 'find names',
      annotationType: 'comment',
    });
    expect(component.disableGenerate).toBe(true);
  });

  it('is enabled again with the same prompt when generation ends without previews', () => {
    setAiRequest('find names');
    component.onGenerate();

    aiPreviewState$.next(false);

    expect(component.disableGenerate).toBe(false);
  });

  it('stays disabled for the same prompt while previews are shown', () => {
    setAiRequest('find names');
    component.onGenerate();

    aiPreviewState$.next(true);

    expect(component.disableGenerate).toBe(true);
  });
});
