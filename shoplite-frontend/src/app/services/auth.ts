import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Utilisateur {
  id: number;
  username: string;
  email: string;
}

export interface IdentifiantsConnexion {
  username: string;
  password: string;
}

export interface DonneesInscription {
  username: string;
  email: string;
  password: string;
}

@Service()
export class Auth {
  private readonly apiUrl = 'http://localhost:8084/api/utilisateurs';
  private http = inject(HttpClient);

  utilisateurConnecte = signal<Utilisateur | null>(this.chargerUtilisateur());

  private chargerUtilisateur(): Utilisateur | null {
    const donnees = localStorage.getItem('utilisateurConnecte');
    return donnees ? JSON.parse(donnees) : null;
  }

  connexion(identifiants: IdentifiantsConnexion): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/connexion`, identifiants);
  }

  inscription(donnees: DonneesInscription): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/inscription`, donnees);
  }

  definirUtilisateurConnecte(utilisateur: Utilisateur): void {
    this.utilisateurConnecte.set(utilisateur);
    localStorage.setItem('utilisateurConnecte', JSON.stringify(utilisateur));
  }

  deconnexion(): void {
    this.utilisateurConnecte.set(null);
    localStorage.removeItem('utilisateurConnecte');
  }
}