import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { translate } from '@net7/core';
import { environment as env } from 'src/environments/environment';
import { providePunditLogin } from './login-module/public-api';
import { config } from './models/config';
import { ChromeExtService } from './services/chrome-ext.service';
import { EmbedService } from './services/embed.service';
import appSettings from './config';
import i18n from './config/i18n';

const LANG_CODE = 'en_US';

translate.init({
  defaultLang: LANG_CODE,
  translations: i18n
});

config.init(appSettings);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    ...providePunditLogin(env.auth),
    { provide: APP_BASE_HREF, useValue: '/' },
    env.chromeExt
      ? {
          provide: APP_INITIALIZER,
          useFactory: (
            chromeExtService: ChromeExtService
          ) => () => chromeExtService.load(),
          deps: [ChromeExtService],
          multi: true
        }
      : {
          provide: APP_INITIALIZER,
          useFactory: (
            embedService: EmbedService
          ) => () => embedService.load(),
          deps: [EmbedService],
          multi: true
        }
  ]
};
