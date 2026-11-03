import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideServiceWorker, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { NotificationService } from './core/services/notification.service';
import { LoggerService } from './core/services/logger.service';

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
      const logger = inject(LoggerService);
      if (!updates.isEnabled) return;

      updates.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => {
          notifications.info('Actualizando la aplicación...');
          void updates.activateUpdate()
            .then(() => window.location.reload())
            .catch(() => logger.operationError('service-worker.activate-update'));
        });
      updates.unrecoverable
        .subscribe(() => {
          notifications.error('La versión almacenada ya no está disponible. Recargando...');
          window.location.reload();
        });

      window.setTimeout(() => {
        void updates.checkForUpdate()
          .catch(() => logger.operationError('service-worker.check-update'));
      }, 30000);
    })
  ]
};
