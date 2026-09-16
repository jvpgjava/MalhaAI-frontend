import { Component, computed, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-input, ui-input',
  standalone: true,
  template: `
    <label class="ui-input" [attr.for]="id()">
      @if (label()) {
        <span class="ui-input__label">{{ label() }}</span>
      }

      <div class="ui-input__field" [class.ui-input__field--invalid]="!!displayError()">
        <input
          class="ui-input__control"
          [class.ui-input__control--with-toggle]="isPassword()"
          [id]="id()"
          [type]="effectiveType()"
          [placeholder]="placeholder()"
          [attr.autocomplete]="autocomplete() || null"
          [attr.inputmode]="type() === 'email' ? 'email' : null"
          [attr.autocapitalize]="type() === 'email' ? 'none' : null"
          [attr.spellcheck]="type() === 'email' ? false : null"
          [required]="required()"
          [disabled]="disabled()"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="touched.set(true)"
        />

        @if (isPassword()) {
          <button
            type="button"
            class="ui-input__toggle"
            [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
            [attr.aria-pressed]="showPassword()"
            (click)="togglePassword()"
          >
            @if (showPassword()) {
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M12 6c-5 0-9.3 3.1-11 7.5 1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5C21.3 9.1 17 6 12 6zm0 12.5A5 5 0 1 1 12 8.5a5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                />
                <path
                  fill="currentColor"
                  d="M3.3 4.7 4.7 3.3l16 16-1.4 1.4z"
                />
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5zm0 12.5A5 5 0 1 1 12 7.5a5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9.5z"
                />
              </svg>
            }
          </button>
        }
      </div>

      @if (displayError()) {
        <span class="ui-input__error">{{ displayError() }}</span>
      }
    </label>
  `,
  styleUrl: './input.scss',
})
export class InputComponent {
  readonly label = input('');
  readonly type = input<'text' | 'email' | 'password' | 'number'>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly error = input('');
  readonly id = input(`ui-input-${Math.random().toString(36).slice(2, 9)}`);
  readonly value = model('');

  readonly showPassword = signal(false);
  readonly touched = signal(false);

  readonly isPassword = computed(() => this.type() === 'password');
  readonly effectiveType = computed(() => {
    if (!this.isPassword()) {
      return this.type();
    }
    return this.showPassword() ? 'text' : 'password';
  });

  readonly displayError = computed(() => {
    if (this.error()) {
      return this.error();
    }
    if (!this.touched() || this.type() !== 'email') {
      return '';
    }
    const email = this.value().trim();
    if (!email && this.required()) {
      return 'Informe o e-mail.';
    }
    if (email && !isEmailValido(email)) {
      return 'E-mail inválido. Use o formato nome@dominio.com';
    }
    return '';
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    let next = target.value;
    if (this.type() === 'email') {
      next = mascararEmail(next);
      if (target.value !== next) {
        target.value = next;
      }
    }
    this.value.set(next);
  }
}

/** Remove espaços e caracteres inválidos comuns em e-mail. */
export function mascararEmail(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9.@_+-]/g, '')
    .toLowerCase();
}

export function isEmailValido(email: string): boolean {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email.trim());
}
