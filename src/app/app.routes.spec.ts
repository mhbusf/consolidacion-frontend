import { routes } from './app.routes';

describe('rutas de Encuentro de Poder', () => {
  it('reserva dashboard y crear ciclo al superadministrador', () => {
    const privateRoutes = routes.filter(route =>
      route.path === 'encuentro-poder' || route.path === 'encuentro-poder/ciclos/nuevo');

    expect(privateRoutes.length).toBe(2);
    expect(privateRoutes.every(route => route.data?.['roles']?.includes('ROLE_SUPER_ADMIN'))).toBeTrue();
  });

  it('mantiene la creación de usuarios disponible para administradores', () => {
    const route = routes.find(candidate => candidate.path === 'usuarios/crear');

    expect(route?.data?.['roles']).toEqual(['ROLE_ADMIN']);
  });

  it('permite las rutas lazy de mentor a MENTOR y SUPER_ADMIN', () => {
    const mentorRoutes = routes.filter(route => route.path?.startsWith('encuentro-poder/mentor'));

    expect(mentorRoutes.length).toBe(2);
    expect(mentorRoutes.map(route => route.data?.['roles'])).toEqual([
      ['ROLE_MENTOR', 'ROLE_SUPER_ADMIN'],
      ['ROLE_MENTOR', 'ROLE_SUPER_ADMIN'],
    ]);
    expect(mentorRoutes.every(route => typeof route.loadComponent === 'function')).toBeTrue();
  });

  it('no abre los módulos USER a un mentor independiente', () => {
    const userRoutes = routes.filter(route => [
      'consolidados', 'consolidados/nuevo', 'consolidados/:id',
      'cafe-con-jesus', 'cafe-con-jesus/nuevo',
    ].includes(route.path ?? ''));

    expect(userRoutes.length).toBe(5);
    expect(userRoutes.every(route => route.data?.['roles']?.includes('ROLE_USER'))).toBeTrue();
  });

  it('mantiene publicas las rutas de inscripcion y asistencia', () => {
    const publicRoutes = routes.filter(route =>
      route.path === 'inscripcion-encuentro/:token' || route.path === 'asistencia-encuentro/:token');

    expect(publicRoutes.length).toBe(2);
    expect(publicRoutes.every(route => !route.canActivate)).toBeTrue();
  });
});
