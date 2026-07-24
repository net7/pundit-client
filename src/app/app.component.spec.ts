import { Component } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
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
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
