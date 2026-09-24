import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
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

  constructor(
    public panierService: Panier,
    public authService: Auth,
    private router: Router
  ) {}

  seDeconnecter(): void {
    this.authService.deconnexion();
    this.router.navigate(['/catalogue']);
  }
}