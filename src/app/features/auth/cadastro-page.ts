import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { Papel } from '../../core/auth/auth.models';
import { BotaoComponent } from '../../ui/botao/botao';
import { InputComponent, isEmailValido, mascararEmail } from '../../ui/input/input';

@Component({
  selector: 'app-cadastro-page',
  standalone: true,
  imports: [FormsModule, RouterLink, BotaoComponent, InputComponent],
  templateUrl: './cadastro-page.html',
  styleUrl: './cadastro-page.scss',
})
export class CadastroPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly nome = signal('');
  readonly email = signal('');
  readonly senha = signal('');
  readonly confirmarSenha = signal('');
  readonly papel = signal<Papel>('ALUNO');
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);

  selecionarPapel(papel: Papel): void {
    this.papel.set(papel);
  }

  async submit(): Promise<void> {
    this.erro.set(null);
    const email = mascararEmail(this.email());
    this.email.set(email);

    if (!isEmailValido(email)) {
      this.erro.set('Informe um e-mail válido (ex.: nome@dominio.com).');
      return;
    }
    if (this.senha() !== this.confirmarSenha()) {
      this.erro.set('As senhas não coincidem.');
      return;
    }
    if (this.senha().length < 6) {
      this.erro.set('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.auth.cadastro(
          {
            email,
            senha: this.senha(),
            papel: this.papel(),
          },
          this.nome(),
        ),
      );
      await this.router.navigateByUrl('/grafo');
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status === 409) {
        this.erro.set('Este e-mail já está cadastrado.');
      } else {
        this.erro.set('Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
