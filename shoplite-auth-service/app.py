"""
Microservice Auth (Python / Flask).

Gere les comptes utilisateurs : inscription et connexion. Meme logique que
 mais ici en Python, avec sa PROPRE base
de donnees PostgreSQL ("auth"), separee des 3 autres services.

flask-bcrypt = l'equivalent Python de BCryptPasswordEncoder (Java) : chiffre
le mot de passe avant de le stocker, et permet de le verifier sans jamais
le dechiffrer.
"""
import os
import re
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins=["http://localhost:4200"])

# --- Connexion a la base de donnees PostgreSQL ---
# Remplace TON_MOT_DE_PASSE par ton vrai mot de passe PostgreSQL.
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:sabine1999@localhost:5432/auth?client_encoding=utf8"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


# --- Politique de mot de passe ---

def valider_mot_de_passe(password):
    """
    Verifie que le mot de passe respecte des regles de securite minimales.
    Retourne (True, None) si tout est bon, sinon (False, "message d'erreur").
    """
    erreurs = []

    if len(password) < 12:
        erreurs.append("au moins 12 caracteres")
    if not re.search(r"[A-Z]", password):
        erreurs.append("au moins une majuscule")
    if not re.search(r"[a-z]", password):
        erreurs.append("au moins une minuscule")
    if not re.search(r"[0-9]", password):
        erreurs.append("au moins un chiffre")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=~`\[\];']", password):
        erreurs.append("au moins un caractere special (ex: ! @ # $ %)")

    if erreurs:
        message = "Le mot de passe doit contenir : " + ", ".join(erreurs) + "."
        return False, message

    return True, None


# --- Modele ---

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        # Attention : on ne renvoie JAMAIS password_hash dans les reponses API !
        return {"id": self.id, "username": self.username, "email": self.email}


# --- Routes de l'API ---

@app.route("/api/utilisateurs/inscription", methods=["POST"])
def inscription():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"erreur": "username, email et password sont obligatoires"}), 400

    mot_de_passe_valide, message_erreur = valider_mot_de_passe(password)
    if not mot_de_passe_valide:
        return jsonify({"erreur": message_erreur}), 400

    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"erreur": "Ce nom d'utilisateur est deja pris."}), 400

    mot_de_passe_hache = bcrypt.generate_password_hash(password).decode("utf-8")
    utilisateur = User(username=username, email=email, password_hash=mot_de_passe_hache)

    db.session.add(utilisateur)
    db.session.commit()

    return jsonify(utilisateur.to_dict()), 201


@app.route("/api/utilisateurs/connexion", methods=["POST"])
def connexion():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    utilisateur = User.query.filter_by(username=username).first()

    if utilisateur is None or not bcrypt.check_password_hash(utilisateur.password_hash, password):
        return jsonify({"erreur": "Nom d'utilisateur ou mot de passe incorrect."}), 401

    return jsonify(utilisateur.to_dict())


@app.route("/api/utilisateurs/<int:user_id>", methods=["GET"])
def obtenir_utilisateur(user_id):
    utilisateur = User.query.get(user_id)
    if utilisateur is None:
        return jsonify({"erreur": "Utilisateur introuvable"}), 404
    return jsonify(utilisateur.to_dict())


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=8084, debug=True)