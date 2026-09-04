import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DonneesPaiement {
  orderId: number;
  amount: number;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface PaiementConfirme {
  id: number;
  order_id: number;
  amount: number;
  card_last4: string;
  status: string;
}

@Service()
export class Paiement {
  private readonly apiUrl = 'http://localhost:8083/api/paiements';
  private http = inject(HttpClient);

  payer(donnees: DonneesPaiement): Observable<PaiementConfirme> {
    return this.http.post<PaiementConfirme>(this.apiUrl, donnees);
  }
}