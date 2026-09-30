import { routes } from './app.routes';

describe('rutas de Encuentro de Poder', () => {
  it('reserva todas las rutas privadas al superadministrador', () => {
    const privateRoutes = routes.filter(route => route.path?.startsWith('encuentro-poder'));

    expect(privateRoutes.length).toBe(2);
    expect(privateRoutes.every(route => route.data?.['roles']?.includes('ROLE_SUPER_ADMIN'))).toBeTrue();
  });

  it('mantiene publicas las rutas de inscripcion y asistencia', () => {
    const publicRoutes = routes.filter(route =>
      route.path === 'inscripcion-encuentro/:token' || route.path === 'asistencia-encuentro/:token');

    expect(publicRoutes.length).toBe(2);
    expect(publicRoutes.every(route => !route.canActivate)).toBeTrue();
  });
});
