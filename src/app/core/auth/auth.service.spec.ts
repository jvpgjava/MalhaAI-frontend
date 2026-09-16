import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('guarda token em signal e sessionStorage após login', async () => {
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);

    const promise = firstValueFrom(
      service.login({ email: 'aluno@teste.com', senha: 'senha123' }),
    );
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'jwt-teste',
      usuarioId: '11111111-1111-1111-1111-111111111111',
      email: 'aluno@teste.com',
      papel: 'ALUNO',
    });

    await promise;

    expect(service.token()).toBe('jwt-teste');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('aluno@teste.com');
    expect(sessionStorage.getItem('malhaia.auth')).toContain('jwt-teste');
  });

  it('logout limpa a sessão em memória e no sessionStorage', async () => {
    const promise = firstValueFrom(service.login({ email: 'a@b.com', senha: 'senha123' }));
    httpMock.expectOne('/api/auth/login').flush({
      token: 't',
      usuarioId: '11111111-1111-1111-1111-111111111111',
      email: 'a@b.com',
      papel: 'ALUNO',
    });
    await promise;

    service.logout();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('malhaia.auth')).toBeNull();
  });

  it('restaura sessão do sessionStorage no boot', () => {
    sessionStorage.setItem(
      'malhaia.auth',
      JSON.stringify({
        token: 'jwt-restored',
        usuario: {
          usuarioId: '11111111-1111-1111-1111-111111111111',
          email: 'resto@teste.com',
          papel: 'ALUNO',
        },
        displayName: 'resto',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const restored = TestBed.inject(AuthService);
    expect(restored.token()).toBe('jwt-restored');
    expect(restored.isAuthenticated()).toBe(true);
    expect(restored.currentUser()?.email).toBe('resto@teste.com');
  });
});
