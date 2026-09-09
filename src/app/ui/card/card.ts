import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card, ui-card',
  standalone: true,
  template: `
    <section class="ui-card" [class.ui-card--padded]="padded()">
      @if (title()) {
        <header class="ui-card__header">
          <h2 class="ui-card__title">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="ui-card__subtitle">{{ subtitle() }}</p>
          }
        </header>
      }
      <div class="ui-card__body">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './card.scss',
})
export class CardComponent {
  readonly title = input('');
  readonly subtitle = input('');
  readonly padded = input(true);
}
