import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { BotaoComponent } from '../botao/botao';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BotaoComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly isCoordenacao = this.auth.isCoordenacao;
  readonly label = computed(() => {
    const name = this.auth.displayName();
    const user = this.auth.currentUser();
    return name || user?.email || '';
  });

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeMenu();
    void this.router.navigateByUrl('/login');
  }
}
