import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Papel } from './auth.models';

export function roleGuard(...allowed: Papel[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const papel = auth.papel();
    if (papel && allowed.includes(papel)) {
      return true;
    }
    if (papel === 'DEV' && allowed.some((p) => p === 'COORDENACAO' || p === 'PROFESSOR' || p === 'DEV')) {
      return true;
    }

    return router.createUrlTree([auth.homePath()]);
  };
}

export const coordenacaoGuard: CanActivateFn = roleGuard('COORDENACAO', 'DEV');
export const documentosGuard: CanActivateFn = roleGuard('PROFESSOR', 'COORDENACAO', 'DEV');
export const adminGuard: CanActivateFn = roleGuard('DEV');
export const alunoGuard: CanActivateFn = roleGuard('ALUNO', 'DEV');
