import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Panier } from '../../services/panier';
import { Auth } from '../../services/auth';
import { Commande } from '../../services/commande';
import { Paiement } from '../../services/paiement';

@Component({
  selector: 'app-paiement-page',
  imports: [FormsModule],
  templateUrl: './paiement-page.html',
  styleUrl: './paiement-page.css',
})
export class PaiementPage implements OnInit {
  cardName = signal('');
  cardNumber = signal('');
  expiry = signal('');
  cvv = signal('');

  erreur = signal('');
  enCours = signal(false);
  confirmation = signal(false);

  constructor(
    public panierService: Panier,
    private authService: Auth,
    private commandeService: Commande,
    private paiementService: Paiement,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.utilisateurConnecte()) {
      this.router.navigate(['/connexion']);
      return;
    }
    if (this.panierService.articles().length === 0) {
      this.router.navigate(['/catalogue']);
    }
  }

  payer(): void {
    this.erreur.set('');
    this.enCours.set(true);

    const utilisateur = this.authService.utilisateurConnecte();
    if (!utilisateur) {
      this.erreur.set('Tu dois etre connecte pour payer.');
      this.enCours.set(false);
      return;
    }

    const items = this.panierService.articles().map((a) => ({
      productId: a.productId,
      quantity: a.quantity,
    }));

    this.commandeService.creerCommande({ userId: utilisateur.id, items }).subscribe({
      next: (commande) => {
        this.paiementService
          .payer({
            orderId: commande.id,
            amount: commande.totalAmount,
            cardName: this.cardName().trim(),
            cardNumber: this.cardNumber().trim(),
            expiry: this.expiry().trim(),
            cvv: this.cvv().trim(),
          })
          .subscribe({
            next: () => {
              this.panierService.vider();
              this.confirmation.set(true);
              this.enCours.set(false);
              setTimeout(() => this.router.navigate(['/catalogue']), 3000);
            },
            error: (err) => {
              this.erreur.set(this.messageErreurPaiement(err));
              this.enCours.set(false);
            },
          });
      },
      error: () => {
        this.erreur.set('Impossible de creer la commande. Reessaie.');
        this.enCours.set(false);
      },
    });
  }

  private messageErreurPaiement(err: any): string {
    if (err.error?.erreurs) {
      return err.error.erreurs.join(' ');
    }
    if (err.error?.erreur) {
      return err.error.erreur;
    }
    return 'Le paiement a echoue. Verifie les informations de la carte.';
  }
}
