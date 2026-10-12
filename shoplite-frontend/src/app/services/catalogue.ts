import { environment } from '../../environments/environments';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Produit {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class Catalogue {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/produits`;
  private http = inject(HttpClient);

  getProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(this.apiUrl);
  }
}