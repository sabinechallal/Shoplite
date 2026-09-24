import { Component, signal, computed } from '@angular/core';
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

  longueurValide = computed(() => this.password().length >= 12);
  majusculeValide = computed(() => /[A-Z]/.test(this.password()));
  minusculeValide = computed(() => /[a-z]/.test(this.password()));
  chiffreValide = computed(() => /[0-9]/.test(this.password()));
  caractereSpecialValide = computed(() =>
    /[!@#$%^&*(),.?":{}|<>_\-+=~`[\];']/.test(this.password())
  );

  motDePasseValide = computed(
    () =>
      this.longueurValide() &&
      this.majusculeValide() &&
      this.minusculeValide() &&
      this.chiffreValide() &&
      this.caractereSpecialValide()
  );

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
          if (err.error && err.error.erreur) {
            this.erreur.set(err.error.erreur);
          } else {
            this.erreur.set('Une erreur est survenue, reessaie.');
          }
        },
      });
  }
}