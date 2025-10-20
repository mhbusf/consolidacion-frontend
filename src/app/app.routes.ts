import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
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
    path: 'cambiar-password',
    loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  
  { path: '**', redirectTo: '/login' }
];