import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AmanPreset } from '../theme/aman-preset';
import { apiErrorInterceptor } from '@core/interceptors/api-error.interceptor';
import { DedupMessageService } from '@core/services/dedup-message.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, apiErrorInterceptor])),
    { provide: MessageService, useClass: DedupMessageService },
    providePrimeNG({
      theme: {
        preset: AmanPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: { name: 'primeng', order: 'reset, primeng' },
        },
      },
      ripple: true,
    }),
  ],
};
