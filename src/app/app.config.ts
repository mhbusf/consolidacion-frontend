import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideServiceWorker, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { NotificationService } from './core/services/notification.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr(), 
      withInterceptors([authInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWithDelay:30000'
    }),
    provideAppInitializer(() => {
      const updates = inject(SwUpdate);
      const notifications = inject(NotificationService);
      if (!updates.isEnabled) return;

      updates.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => notifications.info('Hay una actualización disponible. Recarga la página cuando termines.'));
      updates.unrecoverable
        .subscribe(() => notifications.error('La versión almacenada ya no está disponible. Recarga la página para continuar.'));

      window.setTimeout(() => {
        void updates.checkForUpdate()
          .catch(error => console.error('Error al buscar actualizaciones', error));
      }, 30000);
    })
  ]
};
