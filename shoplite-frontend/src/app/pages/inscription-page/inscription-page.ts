import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-inscription-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './inscription-page.html',
  styleUrl: './inscription-page.css',
})
export class InscriptionPage {
  username = signal('');
  email = signal('');
  password = signal('');
  erreur = signal('');

  constructor(private authService: Auth, private router: Router) {}

  sInscrire(): void {
    this.erreur.set('');
    this.authService
      .inscription({
        username: this.username().trim(),
        email: this.email().trim(),
        password: this.password(),
      })
      .subscribe({
        next: (utilisateur) => {
          console.log('Inscrit :', utilisateur);
          this.router.navigate(['/connexion']);
        },
        error: (err) => {
          if (err.status === 409 || err.status === 400) {
            this.erreur.set("Ce nom d'utilisateur ou cet email est deja utilise.");
          } else {
            this.erreur.set('Une erreur est survenue, reessaie.');
          }
        },
      });
  }
}