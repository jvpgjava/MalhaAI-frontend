import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { BotaoComponent } from '../botao/botao';

interface NavLink {
  path: string;
  label: string;
  show: boolean;
}

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
  readonly papelLabel = this.auth.papelLabel;

  readonly label = computed(() => {
    const name = this.auth.displayName();
    const user = this.auth.currentUser();
    return name || user?.email || '';
  });

  readonly links = computed<NavLink[]>(() => {
    const aluno = this.auth.isAluno() || this.auth.isDev();
    const docs = this.auth.canIndexarDocumentos();
    const oferta = this.auth.canGerirOferta();
    const admin = this.auth.canAdminUsuarios();

    return [
      { path: '/grafo', label: 'Grafo', show: true },
      { path: '/progresso', label: 'Progresso', show: aluno },
      { path: '/eletiva', label: 'Eletiva', show: aluno },
      { path: '/rea', label: 'REA', show: aluno },
      { path: '/documentos', label: 'Documentos', show: docs },
      { path: '/coordenacao', label: 'Oferta', show: oferta },
      { path: '/admin', label: 'Contas', show: admin },
    ].filter((l) => l.show);
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
