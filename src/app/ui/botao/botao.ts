import { Component, input, output } from '@angular/core';

export type BotaoVariant = 'accent' | 'primary' | 'ghost' | 'outline';

@Component({
  selector: 'app-botao, ui-botao',
  standalone: true,
  template: `
    <button
      class="ui-botao"
      [attr.type]="type()"
      [class.ui-botao--accent]="variant() === 'accent'"
      [class.ui-botao--primary]="variant() === 'primary'"
      [class.ui-botao--ghost]="variant() === 'ghost'"
      [class.ui-botao--outline]="variant() === 'outline'"
      [class.ui-botao--full]="fullWidth()"
      [disabled]="disabled() || loading()"
      (click)="clicked.emit($event); onClick()"
    >
      @if (loading()) {
        <span class="ui-botao__spinner" aria-hidden="true"></span>
      }
      @if (label()) {
        {{ label() }}
      } @else {
        <ng-content />
      }
    </button>
  `,
  styleUrl: './botao.scss',
})
export class BotaoComponent {
  readonly label = input('');
  readonly variant = input<BotaoVariant>('accent');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly clicked = output<MouseEvent>();

  onClick(): void {
    // hook for templates that call onClick without output binding
  }
}
