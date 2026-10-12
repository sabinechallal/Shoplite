import { environment } from '../../environments/environments';
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LigneCommande {
  productId: number;
  quantity: number;
}

export interface NouvelleCommande {
  userId: number;
  items: LigneCommande[];
}

export interface CommandeCreee {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
}

@Service()
export class Commande {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/commandes`;
  private http = inject(HttpClient);

  creerCommande(nouvelle: NouvelleCommande): Observable<CommandeCreee> {
    return this.http.post<CommandeCreee>(this.apiUrl, nouvelle);
  }
}