import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { coordenacaoGuard } from './core/auth/coordenacao.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'grafo' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'cadastro',
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/progresso/progresso-page').then((m) => m.ProgressoPage),
  },
  {
    path: 'eletiva',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/eletiva/eletiva-page').then((m) => m.EletivaPage),
  },
  {
    path: 'rea',
    canActivate: [authGuard],
    loadComponent: () => import('./features/rea/rea-page').then((m) => m.ReaPage),
  },
  {
    path: 'duvidas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/duvidas/duvidas-page').then((m) => m.DuvidasPage),
  },
  {
    path: 'coordenacao',
    canActivate: [authGuard, coordenacaoGuard],
    loadComponent: () =>
      import('./features/coordenacao/coordenacao-page').then((m) => m.CoordenacaoPage),
  },
  { path: '**', redirectTo: 'grafo' },
];
