import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Catalogue, Produit } from '../../services/catalogue';
import { Panier } from '../../services/panier';

@Component({
  selector: 'app-catalogue-page',
  imports: [FormsModule],
  templateUrl: './catalogue-page.html',
  styleUrl: './catalogue-page.css',
})
export class CataloguePage implements OnInit {
  produits = signal<Produit[]>([]);
  recherche = signal('');
  tri = signal('nom-asc');
  messageAjout = signal('');

  produitsAffiches = computed(() => {
    const texte = this.recherche().trim().toLowerCase();
    let liste = this.produits();

    if (texte) {
      liste = liste.filter((p) => p.name.toLowerCase().includes(texte));
    }

    liste = [...liste];
    switch (this.tri()) {
      case 'nom-asc':
        liste.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nom-desc':
        liste.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'prix-asc':
        liste.sort((a, b) => a.price - b.price);
        break;
      case 'prix-desc':
        liste.sort((a, b) => b.price - a.price);
        break;
    }

    return liste;
  });

  constructor(private catalogueService: Catalogue, private panierService: Panier) {}

  ngOnInit(): void {
    this.catalogueService.getProduits().subscribe((data) => {
      this.produits.set(data);
    });
  }

  ajouterAuPanier(produit: Produit): void {
    this.panierService.ajouter(produit);
    this.messageAjout.set(`${produit.name} ajoute au panier !`);
    setTimeout(() => this.messageAjout.set(''), 2000);
  }

  categorieSelectionnee = '';

produitsFiltres() {
  return this.produits().filter(p =>
    p.name.toLowerCase().includes(this.recherche().toLowerCase())
  );
}
}