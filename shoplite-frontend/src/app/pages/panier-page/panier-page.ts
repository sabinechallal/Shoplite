import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Panier } from '../../services/panier';

@Component({
  selector: 'app-panier-page',
  imports: [RouterLink],
  templateUrl: './panier-page.html',
  styleUrl: './panier-page.css',
})
export class PanierPage {
  constructor(public panierService: Panier, private router: Router) {}

  augmenter(productId: number, quantiteActuelle: number): void {
    this.panierService.changerQuantite(productId, quantiteActuelle + 1);
  }

  diminuer(productId: number, quantiteActuelle: number): void {
    this.panierService.changerQuantite(productId, quantiteActuelle - 1);
  }

  supprimer(productId: number): void {
    this.panierService.retirer(productId);
  }

  sousTotal(prix: number, quantite: number): number {
    return Math.round(prix * quantite * 100) / 100;
  }

  allerAuPaiement(): void {
    this.router.navigate(['/paiement']);
  }
}