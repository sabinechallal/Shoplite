import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-connexion-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './connexion-page.html',
  styleUrl: './connexion-page.css',
})
export class ConnexionPage {
  username = signal('');
  password = signal('');
  erreur = signal('');

  constructor(private authService: Auth, private router: Router) {}

  seConnecter(): void {
    this.erreur.set('');
    this.authService
      .connexion({ username: this.username().trim(), password: this.password() })
      .subscribe({
        next: (utilisateur) => {
          console.log('Connecte :', utilisateur);
          this.authService.definirUtilisateurConnecte(utilisateur);
          this.router.navigate(['/catalogue']);
        },
        error: () => {
          this.erreur.set("Nom d'utilisateur ou mot de passe incorrect.");
        },
      });
  }
}