import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DvComponentsLibModule } from '@n7-frontend/components';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvComponentsLibModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
