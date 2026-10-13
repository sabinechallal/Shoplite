import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Panier } from './services/panier';
import { Auth } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('shoplite-frontend');
  protected readonly estPageAccueil = signal(false);

  constructor(
    public panierService: Panier,
    public authService: Auth,
    private router: Router
  ) {
    this.estPageAccueil.set(this.router.url === '/');
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.estPageAccueil.set(event.urlAfterRedirects === '/');
      });
  }

  seDeconnecter(): void {
    this.authService.deconnexion();
    this.router.navigate(['/catalogue']);
  }
}