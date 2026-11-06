import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import {
  adminGuard,
  alunoGuard,
  coordenacaoGuard,
  documentosGuard,
} from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'grafo' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/cadastro-page').then((m) => m.CadastroPage),
  },
  {
    path: 'grafo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/grafo/grafo-page').then((m) => m.GrafoPage),
  },
  {
    path: 'progresso',
    canActivate: [authGuard, alunoGuard],
    loadComponent: () =>
      import('./features/progresso/progresso-page').then((m) => m.ProgressoPage),
  },
  {
    path: 'eletiva',
    canActivate: [authGuard, alunoGuard],
    loadComponent: () =>
      import('./features/eletiva/eletiva-page').then((m) => m.EletivaPage),
  },
  {
    path: 'rea',
    canActivate: [authGuard, alunoGuard],
    loadComponent: () => import('./features/rea/rea-page').then((m) => m.ReaPage),
  },
  {
    path: 'documentos',
    canActivate: [authGuard, documentosGuard],
    loadComponent: () =>
      import('./features/documentos/documentos-page').then((m) => m.DocumentosPage),
  },
  {
    path: 'coordenacao',
    canActivate: [authGuard, coordenacaoGuard],
    loadComponent: () =>
      import('./features/coordenacao/coordenacao-page').then((m) => m.CoordenacaoPage),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-page').then((m) => m.AdminPage),
  },
  { path: '**', redirectTo: 'grafo' },
];
