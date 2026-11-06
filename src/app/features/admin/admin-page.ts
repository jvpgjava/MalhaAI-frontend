import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { PAPEIS, Papel, labelPapel } from '../../core/auth/auth.models';
import { safeErrorMessage } from '../../core/http/safe-error';
import { BotaoComponent } from '../../ui/botao/botao';
import { CardComponent } from '../../ui/card/card';
import { InputComponent, isEmailValido, mascararEmail } from '../../ui/input/input';
import { ModalComponent } from '../../ui/modal/modal';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [FormsModule, BotaoComponent, CardComponent, InputComponent, ModalComponent],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage {
  private readonly auth = inject(AuthService);

  readonly papeis = PAPEIS;
  readonly email = signal('');
  readonly senha = signal('');
  readonly papel = signal<Papel>('ALUNO');
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucessoOpen = signal(false);
  readonly sucessoMsg = signal('');

  labelPapel = labelPapel;

  descricao(papel: Papel): string {
    switch (papel) {
      case 'ALUNO':
        return 'Grafo, progresso, eletiva e REA';
      case 'PROFESSOR':
        return 'Consulta + indexar documentos / testar IA';
      case 'COORDENACAO':
        return 'Oferta semestral + documentos';
      case 'DEV':
        return 'Acesso total e criação de contas';
    }
  }

  selecionarPapel(papel: Papel): void {
    this.papel.set(papel);
  }

  async criar(): Promise<void> {
    this.erro.set(null);
    const email = mascararEmail(this.email());
    this.email.set(email);

    if (!isEmailValido(email)) {
      this.erro.set('Informe um e-mail válido.');
      return;
    }
    if (this.senha().length < 6) {
      this.erro.set('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.auth.criarUsuario({
          email,
          senha: this.senha(),
          papel: this.papel(),
        }),
      );
      this.sucessoMsg.set(
        `Conta criada: ${res.email} (${labelPapel(res.papel)}). Informe a senha ao usuário.`,
      );
      this.sucessoOpen.set(true);
      this.email.set('');
      this.senha.set('');
      this.papel.set('ALUNO');
    } catch (err) {
      this.erro.set(
        safeErrorMessage(err, 'Não foi possível criar a conta.', {
          403: 'Apenas DEV pode criar contas privilegiadas.',
          409: 'Não foi possível concluir o cadastro com estes dados.',
        }),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
