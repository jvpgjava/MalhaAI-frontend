import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-input, ui-input',
  standalone: true,
  template: `
    <label class="ui-input" [attr.for]="id()">
      @if (label()) {
        <span class="ui-input__label">{{ label() }}</span>
      }
      <input
        class="ui-input__control"
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete() || null"
        [required]="required()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
      />
      @if (error()) {
        <span class="ui-input__error">{{ error() }}</span>
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

  onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.value.set(target.value);
    }
  }
}
