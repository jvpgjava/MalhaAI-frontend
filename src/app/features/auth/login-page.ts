import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { InputComponent } from '../../ui/input/input';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, BotaoComponent, CardComponent, InputComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly senha = signal('');
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);

  async submit(): Promise<void> {
    this.erro.set(null);
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.auth.login({ email: this.email().trim(), senha: this.senha() }),
      );
      await this.router.navigateByUrl('/grafo');
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status === 401 || httpErr.status === 403) {
        this.erro.set('E-mail ou senha inválidos.');
      } else {
        this.erro.set('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
