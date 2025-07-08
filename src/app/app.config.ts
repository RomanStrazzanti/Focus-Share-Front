// src/app/app.config.ts

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { MockUserSettingsService } from './timer/timer';
import { AudioService } from './services/audio/audio'; // <-- ADD/VERIFY THIS LINE

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    MockUserSettingsService,
    AudioService // <-- ADD/VERIFY THIS LINE
  ]
};