import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Prefixa chamadas relativas `/api/...` com o host do backend (sem proxy do ng serve). */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiUrl.replace(/\/$/, '');
  if (!base || !req.url.startsWith('/api')) {
    return next(req);
  }
  return next(req.clone({ url: `${base}${req.url}` }));
};
