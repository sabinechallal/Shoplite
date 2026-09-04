import { Routes } from '@angular/router';
import { CataloguePage } from './pages/catalogue-page/catalogue-page';
import { ConnexionPage } from './pages/connexion-page/connexion-page';
import { InscriptionPage } from './pages/inscription-page/inscription-page';
import { PanierPage } from './pages/panier-page/panier-page';
import { PaiementPage } from './pages/paiement-page/paiement-page';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
  { path: 'catalogue', component: CataloguePage },
  { path: 'connexion', component: ConnexionPage },
  { path: 'inscription', component: InscriptionPage },
  { path: 'panier', component: PanierPage },
  { path: 'paiement', component: PaiementPage },
];