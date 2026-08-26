import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  
  // ELIMINADO: register (solo admins pueden crear usuarios)
  
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },

  {
    path: 'consolidados-atrasos',
    loadComponent: () => import('./features/admin/consolidados-atrasos/consolidados-atrasos.component').then(m => m.ConsolidadosAtrasosComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },

  {
    path: 'estadisticas-gdc',
    loadComponent: () => import('./features/admin/estadisticas-gdc/estadisticas-gdc.component').then(m => m.EstadisticasGdcComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },

  {
    path: 'reportes/consolidados',
    loadComponent: () => import('./features/admin/reportes-consolidados/reportes-consolidados.component').then(m => m.ReportesConsolidadosComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  
  {
    path: 'consolidados',
    loadComponent: () => import('./features/consolidados/list/consolidados-list.component').then(m => m.ConsolidadosListComponent),
    canActivate: [authGuard]
  },
  
  {
    path: 'consolidados/nuevo',
    loadComponent: () => import('./features/consolidados/create/consolidado-create.component').then(m => m.ConsolidadoCreateComponent),
    canActivate: [authGuard]
  },
  
  {
    path: 'consolidados/:id',
    loadComponent: () => import('./features/consolidados/detail/consolidado-detail.component').then(m => m.ConsolidadoDetailComponent),
    canActivate: [authGuard]
  },
  
  {
    path: 'consolidados/:id/asignar',
    loadComponent: () => import('./features/consolidados/asignar/asignar-consolidado.component').then(m => m.AsignarConsolidadoComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  
  {
    path: 'usuarios',
    loadComponent: () => import('./features/usuarios/list/usuarios-list.component').then(m => m.UsuariosListComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  
  {
    path: 'usuarios/crear',
    loadComponent: () => import('./features/usuarios/crear/crear-usuario.component').then(m => m.CrearUsuarioComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  
  {
    path: 'cafe-con-jesus',
    loadComponent: () => import('./features/cafe-con-jesus/list/cafe-list.component').then(m => m.CafeListComponent),
    canActivate: [authGuard]
  },

  {
    path: 'cafe-con-jesus/nuevo',
    loadComponent: () => import('./features/cafe-con-jesus/create/cafe-create.component').then(m => m.CafeCreateComponent),
    canActivate: [authGuard]
  },

  {
    path: 'cafe-admin',
    loadComponent: () => import('./features/cafe-con-jesus/admin/cafe-admin-dashboard.component').then(m => m.CafeAdminDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },

  {
    path: 'change-password',
    loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '/login' }
];
