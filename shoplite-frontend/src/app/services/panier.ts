import { Injectable, signal, computed } from '@angular/core';

export interface ArticlePanier {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class Panier {
  articles = signal<ArticlePanier[]>(this.chargerPanier());

  animationBadge = signal(false);

  total = computed(() => {
    const somme = this.articles().reduce((s, a) => s + a.price * a.quantity, 0);
    return Math.round(somme * 100) / 100;
  });

  nombreArticles = computed(() =>
    this.articles().reduce((somme, a) => somme + a.quantity, 0)
  );

  private chargerPanier(): ArticlePanier[] {
    const donnees = localStorage.getItem('panier');
    return donnees ? JSON.parse(donnees) : [];
  }

  private sauvegarder(): void {
    localStorage.setItem('panier', JSON.stringify(this.articles()));
  }

  ajouter(produit: { id: number; name: string; price: number }): void {
    const liste = this.articles();
    const existant = liste.find((a) => a.productId === produit.id);

    if (existant) {
      this.articles.set(
        liste.map((a) =>
          a.productId === produit.id ? { ...a, quantity: a.quantity + 1 } : a
        )
      );
    } else {
      this.articles.set([
        ...liste,
        { productId: produit.id, name: produit.name, price: produit.price, quantity: 1 },
      ]);
    }
    this.sauvegarder();

    this.animationBadge.set(true);
    setTimeout(() => this.animationBadge.set(false), 300);
  }

  changerQuantite(productId: number, quantite: number): void {
    if (quantite <= 0) {
      this.retirer(productId);
      return;
    }
    this.articles.set(
      this.articles().map((a) =>
        a.productId === productId ? { ...a, quantity: quantite } : a
      )
    );
    this.sauvegarder();
  }

  retirer(productId: number): void {
    this.articles.set(this.articles().filter((a) => a.productId !== productId));
    this.sauvegarder();
  }

  vider(): void {
    this.articles.set([]);
    this.sauvegarder();
  }
}