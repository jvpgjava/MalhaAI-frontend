import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div
        class="malha-modal-backdrop"
        role="presentation"
        (click)="onBackdropClick()"
      >
        <div
          class="malha-modal-panel"
          [class.malha-modal-panel--lg]="size() === 'lg'"
          [class.malha-modal-panel--xl]="size() === 'xl'"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (click)="$event.stopPropagation()"
        >
          @if (showClose()) {
            <button
              type="button"
              class="malha-modal-close"
              aria-label="Fechar"
              (click)="close.emit()"
            >
              ×
            </button>
          }

          <div class="malha-dialog-body">
            @if (icon()) {
              <div class="malha-dialog-icon" aria-hidden="true">{{ icon() }}</div>
            }
            @if (title()) {
              <h2 [id]="titleId" class="malha-dialog-title">{{ title() }}</h2>
            }
            @if (message()) {
              <p class="malha-dialog-message">{{ message() }}</p>
            }
            <div class="malha-dialog-content">
              <ng-content />
            </div>
            <div class="malha-dialog-actions">
              <ng-content select="[modal-actions]" />
            </div>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly titleId = `malha-modal-${Math.random().toString(36).slice(2, 9)}`;

  readonly open = input(false);
  readonly title = input('');
  readonly message = input('');
  readonly icon = input('');
  readonly size = input<'md' | 'lg' | 'xl'>('md');
  readonly showClose = input(true);
  readonly closeOnBackdrop = input(true);

  readonly close = output<void>();

  constructor() {
    effect(() => {
      if (typeof document === 'undefined') {
        return;
      }
      document.body.style.overflow = this.open() ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close.emit();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }
}
