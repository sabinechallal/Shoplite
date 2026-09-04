"""
Microservice Commande (Python / Flask).

Equivalent Python de ce qu'on a fait en Java pour le Catalogue :
- Flask = l'equivalent "leger" de Spring Boot (cree le serveur web)
- Flask-SQLAlchemy = l'equivalent de Spring Data JPA (parle a la base de
  donnees sans ecrire de SQL a la main)
- psycopg2 = le driver qui permet a Python de parler a PostgreSQL

Ce service gere le panier et les commandes, avec sa PROPRE base de donnees
PostgreSQL ("commande"), separee de celle du Catalogue et de celle du
monolithe.
"""
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import requests
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:4200"])

print("### VERSION CONNEXION 1 - CE FICHIER EST BIEN LE BON ###")

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:sabine1999@localhost:5432/commande"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
CATALOGUE_SERVICE_URL = os.environ.get("CATALOGUE_SERVICE_URL", "http://localhost:8081")
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://localhost:8084")

class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), default="EN_ATTENTE")

    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "createdAt": self.created_at.isoformat(),
            "totalAmount": float(self.total_amount),
            "status": self.status,
            "items": [item.to_dict() for item in self.items],
        }
       


class OrderItem(db.Model):
    __tablename__ = "order_item"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "quantity": self.quantity,
            "unitPrice": float(self.unit_price),
        }


@app.route("/api/commandes", methods=["GET"])
def lister_commandes():
    commandes = Order.query.all()
    return jsonify([c.to_dict() for c in commandes])


@app.route("/api/commandes/<int:commande_id>", methods=["GET"])
def obtenir_commande(commande_id):
    commande = Order.query.get(commande_id)
    if commande is None:
        return jsonify({"erreur": "Commande introuvable"}), 404
    return jsonify(commande.to_dict())

@app.route("/api/commandes/<int:commande_id>/statut", methods=["PATCH"])
def modifier_statut_commande(commande_id):
    """
    CONNEXION 3 : le service Paiement appellera cette route juste apres
    avoir cree un paiement reussi, pour dire a Commande "cette commande
    est maintenant payee". Exemple de JSON envoye :
    { "statut": "PAYEE" }
    """
    commande = Order.query.get(commande_id)
    if commande is None:
        return jsonify({"erreur": "Commande introuvable"}), 404

    data = request.get_json()
    nouveau_statut = data.get("statut")

    if not nouveau_statut:
        return jsonify({"erreur": "Le champ 'statut' est obligatoire"}), 400

    commande.status = nouveau_statut
    db.session.commit()

    return jsonify(commande.to_dict())


def recuperer_prix_produit(product_id):
    try:
        reponse = requests.get(f"{CATALOGUE_SERVICE_URL}/api/produits/{product_id}", timeout=3)
        if reponse.status_code == 200:
            return reponse.json()["price"]
        return None
    except requests.exceptions.RequestException as e:
        print(f"[Commande] Impossible de contacter le Catalogue : {e}")
        return None

def utilisateur_existe(user_id):
    """
    CONNEXION 4 : verifie aupres du service Auth que cet utilisateur existe
    vraiment, avant de lui laisser passer une commande. Meme principe que
    recuperer_prix_produit() : on ne fait pas confiance a un userId invente.
    """
    try:
        reponse = requests.get(f"{AUTH_SERVICE_URL}/api/utilisateurs/{user_id}", timeout=3)
        return reponse.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"[Commande] Impossible de contacter le service Auth : {e}")
        return False


@app.route("/api/commandes", methods=["POST"])
def creer_commande():
    """
    Cree une nouvelle commande a partir du JSON envoye, par exemple :
    {
      "userId": 1,
      "items": [
        {"productId": 3, "quantity": 2},
        {"productId": 7, "quantity": 1}
      ]
    }
    CONNEXION 4 : userId est obligatoire, et on verifie aupres du service
    Auth que cet utilisateur existe vraiment.
    """
    data = request.get_json()
    user_id = data.get("userId")
    items_data = data.get("items", [])

    if not user_id:
        return jsonify({"erreur": "Le champ 'userId' est obligatoire"}), 400

    if not utilisateur_existe(user_id):
        return jsonify({
            "erreur": f"Utilisateur {user_id} introuvable ou service Auth indisponible"
        }), 400

    if not items_data:
        return jsonify({"erreur": "La commande doit contenir au moins un produit"}), 400

    lignes = []
    total = 0

    for item in items_data:
        product_id = item["productId"]
        quantity = item["quantity"]

        prix = recuperer_prix_produit(product_id)
        if prix is None:
            return jsonify({
                "erreur": f"Produit {product_id} introuvable ou service Catalogue indisponible"
            }), 400

        total += quantity * prix
        lignes.append(OrderItem(product_id=product_id, quantity=quantity, unit_price=prix))

    commande = Order(user_id=user_id, total_amount=total, status="EN_ATTENTE")
    commande.items = lignes

    db.session.add(commande)
    db.session.commit()

    return jsonify(commande.to_dict()), 201


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=8082, debug=True)