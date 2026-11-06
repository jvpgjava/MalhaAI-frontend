import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { safeErrorMessage } from '../../core/http/safe-error';
import { BotaoComponent } from '../../ui/botao/botao';
import { InputComponent, isEmailValido, mascararEmail } from '../../ui/input/input';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, BotaoComponent, InputComponent],
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
    const email = mascararEmail(this.email());
    this.email.set(email);

    if (!isEmailValido(email)) {
      this.erro.set('Informe um e-mail válido (ex.: nome@dominio.com).');
      return;
    }
    if (!this.senha()) {
      this.erro.set('Informe a senha.');
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(this.auth.login({ email, senha: this.senha() }));
      await this.router.navigateByUrl(this.auth.homePath());
    } catch (err) {
      this.erro.set(
        safeErrorMessage(err, 'Não foi possível entrar. Tente novamente.', {
          401: 'E-mail ou senha inválidos.',
          403: 'E-mail ou senha inválidos.',
          429: 'Muitas tentativas. Aguarde um momento e tente de novo.',
        }),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
