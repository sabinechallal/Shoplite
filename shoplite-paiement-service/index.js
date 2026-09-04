/**
 * Microservice Paiement (Node.js / Express).
 *
 * Equivalent Node.js de ce qu'on a fait en Java (Catalogue) et Python
 * (Commande) :
 * - Express = l'equivalent de Spring Boot / Flask (cree le serveur web)
 * - pg = le driver qui permet a Node.js de parler a PostgreSQL
 *
 * Contrairement a Hibernate (Java) ou SQLAlchemy (Python), Node.js + pg
 * n'a pas d'ORM automatique par defaut : on ecrit nous-memes les requetes
 * SQL. C'est plus "manuel", mais ca montre bien ce qui se passe derriere
 * les outils automatiques des deux autres services.
 *
 * Ce service simule un paiement par carte bancaire (meme logique que
 * l'ancien PaymentController.java du monolithe : validation du format
 * uniquement, aucune vraie transaction), avec sa PROPRE base de donnees
 * PostgreSQL ("paiement").
 */

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.json()); // permet de lire le JSON envoye dans les requetes

const PORT = 8083;

// --- Adresse du microservice Commande ---
// CONNEXION 2 : Paiement va verifier le montant reel de la commande
// aupres de Commande, au lieu de faire confiance au "amount" envoye
// par le client (qui pourrait etre invente).
const COMMANDE_SERVICE_URL = process.env.COMMANDE_SERVICE_URL || "http://localhost:8082";

// --- Connexion a la base de donnees PostgreSQL ---
// Remplace TON_MOT_DE_PASSE par ton vrai mot de passe PostgreSQL.
// --- Connexion a la base de donnees PostgreSQL ---
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: 5432,
  database: "paiement",
  user: "postgres",
  password: "sabine1999",
});


// --- Cree la table au demarrage si elle n'existe pas encore ---
// (l'equivalent manuel de ddl-auto=update en Java, ou db.create_all() en Python)
async function initialiserBase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER,
      amount NUMERIC(10, 2) NOT NULL,
      card_last4 VARCHAR(4) NOT NULL,
      status VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("[Paiement] Table 'payments' prete.");
}

// --- Validations, identiques a l'ancien PaymentController.java ---
const CARD_NUMBER_REGEX = /^\d{16}$/;
const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVV_REGEX = /^\d{3}$/;

// --- Routes de l'API ---

app.post("/api/paiements", async (req, res) => {

  // --- CONNEXION 2 ---
// Va demander a Commande la VRAIE commande (avec son vrai montant), au lieu
// de faire confiance au "amount" envoye par le client. Meme principe que
// recuperer_prix_produit() en Python cote Commande.
async function recupererCommande(orderId) {
  try {
    const reponse = await fetch(`${COMMANDE_SERVICE_URL}/api/commandes/${orderId}`);
    if (reponse.ok) {
      return await reponse.json();
    }
    return null;
  } catch (e) {
    console.log(`[Paiement] Impossible de contacter le service Commande : ${e}`);
    return null;
  }
}
  const { orderId, amount, cardName, cardNumber, expiry, cvv } = req.body;

  const numeroNettoye = (cardNumber || "").replace(/\s/g, "");
  const erreurs = [];

  if (!cardName || cardName.trim() === "") {
    erreurs.push("Le nom sur la carte est obligatoire.");
  }
  if (!CARD_NUMBER_REGEX.test(numeroNettoye)) {
    erreurs.push("Le numero de carte doit contenir 16 chiffres.");
  }
  if (!EXPIRY_REGEX.test(expiry || "")) {
    erreurs.push("La date d'expiration doit etre au format MM/AA.");
  }
  if (!CVV_REGEX.test(cvv || "")) {
    erreurs.push("Le CVV doit contenir 3 chiffres.");
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }


  // --- CONNEXION 2 : verification du montant reel aupres de Commande ---
  const commande = await recupererCommande(orderId);

  if (commande === null) {
    return res.status(400).json({
      erreur: `Commande ${orderId} introuvable ou service Commande indisponible`,
    });
  }

  if (Number(commande.totalAmount) !== Number(amount)) {
    return res.status(400).json({
      erreur: `Le montant envoye (${amount}) ne correspond pas au montant reel de la commande (${commande.totalAmount})`,
    });
  }

  const derniers4 = numeroNettoye.slice(-4);

const resultat = await pool.query(
    `INSERT INTO payments (order_id, amount, card_last4, status)
     VALUES ($1, $2, $3, 'PAYEE')
     RETURNING *`,
    [orderId, amount, derniers4]
  );

  // --- CONNEXION 3 : on previent Commande que la commande est payee ---
  try {
    await fetch(`${COMMANDE_SERVICE_URL}/api/commandes/${orderId}/statut`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "PAYEE" }),
    });
  } catch (e) {
    console.log(`[Paiement] Impossible de mettre a jour le statut de la commande : ${e}`);
  }

  res.status(201).json(resultat.rows[0]);
});

app.get("/api/paiements/:id", async (req, res) => {
  const resultat = await pool.query("SELECT * FROM payments WHERE id = $1", [req.params.id]);
  if (resultat.rows.length === 0) {
    return res.status(404).json({ erreur: "Paiement introuvable" });
  }
  res.json(resultat.rows[0]);
});

app.get("/api/paiements", async (req, res) => {
  const resultat = await pool.query("SELECT * FROM payments ORDER BY id");
  res.json(resultat.rows);
});

// --- Demarrage du serveur ---
initialiserBase().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Paiement] Service demarre sur http://localhost:${PORT}`);
  });
});
