#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Remplace la colonne "photo" de produits.csv par de vraies photos professionnelles
(Pexels) correspondant au type de produit, deduit du nom du produit.

v5 :
- chaque mot-cle a maintenant une liste de "mots requis" : une photo n'est
  gardee que si sa description (fournie par Pexels) contient au moins un de
  ces mots. Ca evite les faux positifs completement hors-sujet (ex: une
  pelote de laine pour "alimentation", un appareil photo vintage pour
  "webcam", un chariot de supermarche pour "mini pc"...).
- on ecarte toujours les photos dont la description mentionne une main/une
  personne.
- taille d'image "large" (plus nette).
- chaque produit recoit une photo differente de celle des autres produits de
  la meme categorie.

Ne touche a aucune autre colonne (nom, description, prix, categorie).

Usage :
    python fix_images_pexels.py produits.csv VOTRE_CLE_API_PEXELS

Ecrase le fichier en place (une sauvegarde .bak est creee).
"""
import csv
import json
import shutil
import sys
import time
import urllib.parse
import urllib.request

# (mot francais a detecter dans le nom, requete anglaise pour Pexels,
#  liste de mots dont AU MOINS UN doit apparaitre dans la description Pexels)
KEYWORDS = [
    ("carte graphique", "graphics card gpu electronics", ["graphics card", "gpu", "video card"]),
    ("carte mere", "computer motherboard electronics", ["motherboard"]),
    ("carte memoire", "sd memory card electronics", ["sd card", "memory card", "microsd"]),
    ("barrette ram", "computer ram module electronics", ["ram", "memory module", "ram stick"]),
    ("ssd nvme", "ssd nvme solid state drive electronics", ["ssd", "solid state drive", "nvme"]),
    ("ssd interne", "ssd solid state drive electronics", ["ssd", "solid state drive"]),
    ("ssd externe", "external ssd solid state drive", ["ssd", "solid state drive"]),
    ("disque dur externe", "external hard drive disk", ["hard drive", "hard disk", "external drive"]),
    ("cle usb wifi", "usb wifi adapter dongle electronics", ["wifi adapter", "usb dongle", "wireless adapter", "dongle"]),
    ("cle usb", "usb flash drive electronics", ["usb drive", "flash drive", "usb stick"]),
    ("nas", "nas network storage server device", ["nas", "network storage", "server", "storage device"]),
    ("boitier pc", "pc case tower computer", ["pc case", "computer case", "tower case", "computer tower"]),
    ("alimentation pc", "computer power supply unit psu electronics", ["power supply", "psu"]),
    ("ventirad", "cpu heatsink cooler fan electronics", ["cooler", "heatsink", "cpu fan", "fan"]),
    ("station de travail", "desktop tower workstation computer", ["desktop", "tower", "workstation", "computer case", "pc"]),
    ("pc de bureau", "desktop computer tower", ["desktop", "tower", "computer case", "pc"]),
    ("mini pc", "mini pc small form factor computer device", ["mini pc", "small computer", "compact pc", "computer"]),
    ("ultrabook", "ultrabook laptop", ["laptop", "notebook", "ultrabook"]),
    ("chromebook", "laptop computer", ["laptop", "notebook", "chromebook"]),
    ("laptop", "laptop computer", ["laptop", "notebook"]),
    ("moniteur incurve", "curved monitor screen", ["monitor", "screen", "display"]),
    ("moniteur", "computer monitor screen", ["monitor", "screen", "display"]),
    ("ecran gaming", "gaming monitor screen", ["monitor", "screen", "display"]),
    ("ecran portable", "portable monitor screen", ["monitor", "screen", "display"]),
    ("clavier mecanique", "mechanical keyboard", ["keyboard"]),
    ("clavier sans fil", "wireless keyboard", ["keyboard"]),
    ("souris ergonomique", "computer mouse peripheral electronics", ["mouse"]),
    ("souris gamer", "gaming mouse peripheral electronics", ["mouse"]),
    ("webcam", "usb webcam computer camera device", ["webcam", "web cam"]),
    ("casque vr", "vr headset virtual reality", ["vr", "virtual reality", "headset"]),
    ("casque gamer", "gaming headset", ["headset", "headphones"]),
    ("casque audio", "headphones", ["headphones", "headset"]),
    ("chaise gamer", "gaming chair", ["chair"]),
    ("manette de jeu", "video game controller gamepad", ["controller", "gamepad"]),
    ("stream deck", "stream deck controller", ["stream deck", "controller", "keypad"]),
    ("tapis de souris", "large desk mat mousepad", ["mouse pad", "mousepad", "desk mat"]),
    ("repose-poignet", "wrist rest keyboard accessory", ["wrist rest"]),
    ("support laptop", "laptop stand", ["laptop stand", "stand"]),
    ("station d'accueil", "laptop docking station", ["docking station", "dock", "hub"]),
    ("hub usb-c", "usb c hub adapter", ["hub", "usb c", "adapter"]),
    ("chargeur usb-c", "usb c charger", ["charger"]),
    ("cable hdmi", "hdmi cable", ["hdmi", "cable"]),
    ("onduleur", "ups uninterruptible power supply battery backup", ["ups", "battery backup", "surge protector", "uninterruptible"]),
    ("routeur wifi", "wifi router modem device", ["router", "modem", "wifi"]),
    ("repeteur wifi", "wifi range extender device", ["extender", "wifi", "repeater", "booster"]),
    ("mesh wifi", "mesh wifi router system", ["mesh", "router", "wifi"]),
    ("switch reseau", "ethernet network switch device", ["switch", "ethernet", "network"]),
    ("camera ip", "ip security camera device", ["camera", "cctv", "security"]),
]

BLACKLIST = [
    "hand", "hands", "person", "people", "man ", " man", "woman", "girl", "boy",
    "holding", "hold ", "finger", "wearing", "portrait", "model", "face",
    "human", "kid", "child", "typing on",
]

WHITELIST = [
    "isolated", "white background", "product", "studio", "on white",
    "close up", "close-up",
]


def keyword_info_for(nom):
    nom_lower = nom.lower()
    for needle, query, required in KEYWORDS:
        if needle in nom_lower:
            return query, required
    return "computer hardware electronics", ["computer", "electronics", "device"]


def is_clean(alt_text):
    alt_lower = (alt_text or "").lower()
    return not any(bad in alt_lower for bad in BLACKLIST)


def matches_required(alt_text, required):
    alt_lower = (alt_text or "").lower()
    return any(req in alt_lower for req in required)


def score(alt_text):
    alt_lower = (alt_text or "").lower()
    return sum(1 for good in WHITELIST if good in alt_lower)


def _search(query, api_key, per_page):
    url = (
        "https://api.pexels.com/v1/search?query="
        + urllib.parse.quote(query)
        + f"&per_page={per_page}&orientation=landscape"
    )
    req = urllib.request.Request(url, headers={
        "Authorization": api_key,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("photos", [])


def fetch_pexels_urls(query, required, api_key, needed):
    """Renvoie jusqu'a `needed` URLs de photos differentes, propres et pertinentes."""
    photos = []
    try:
        photos = _search(query, api_key, 80)
    except Exception as e:
        print(f"  ! erreur pour '{query}': {e}")

    try:
        photos_bonus = _search(query + " product photo isolated on white background", api_key, 80)
        seen_ids = {p["id"] for p in photos}
        for p in photos_bonus:
            if p["id"] not in seen_ids:
                photos.append(p)
                seen_ids.add(p["id"])
    except Exception as e:
        print(f"  ! erreur (bonus) pour '{query}': {e}")

    if not photos:
        return []

    clean = [p for p in photos if is_clean(p.get("alt", ""))]
    pool = clean if clean else photos

    # niveau 1 : propre + contient un mot requis (le plus fiable)
    relevant = [p for p in pool if matches_required(p.get("alt", ""), required)]
    # niveau 2 (repli) : propre mais mot requis absent (la description Pexels
    # est parfois vide ou peu descriptive)
    fallback_pool = [p for p in pool if p not in relevant]

    relevant.sort(key=lambda p: score(p.get("alt", "")), reverse=True)
    fallback_pool.sort(key=lambda p: score(p.get("alt", "")), reverse=True)

    ordered = relevant + fallback_pool
    return [p["src"]["large"] for p in ordered]


def main():
    if len(sys.argv) != 3:
        print("Usage: python fix_images_pexels.py produits.csv VOTRE_CLE_API_PEXELS")
        sys.exit(1)

    path, api_key = sys.argv[1], sys.argv[2]
    backup_path = path + ".bak"
    shutil.copyfile(path, backup_path)
    print(f"Sauvegarde creee : {backup_path}")

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        rows = list(reader)

    header = rows[0]
    photo_index = header.index("photo")
    nom_index = header.index("nom")

    row_info = []
    for row in rows[1:]:
        row_info.append(keyword_info_for(row[nom_index]) if len(row) > nom_index else ("computer hardware", ["computer"]))

    counts = {}
    for query, _ in row_info:
        counts[query] = counts.get(query, 0) + 1

    unique_queries = {q: r for q, r in row_info}
    print(f"{len(unique_queries)} mots-cles uniques a interroger sur Pexels...")

    urls_by_query = {}
    fallback = "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800"
    for i, (query, required) in enumerate(unique_queries.items(), start=1):
        needed = counts[query]
        urls = fetch_pexels_urls(query, required, api_key, needed)
        if urls:
            urls_by_query[query] = urls
            unique_count = len(set(urls))
            print(f"  [{i}/{len(unique_queries)}] {query} -> {unique_count} photo(s) pertinentes pour {needed} produit(s)")
        else:
            urls_by_query[query] = [fallback]
            print(f"  [{i}/{len(unique_queries)}] {query} -> echec, image generique utilisee")
        time.sleep(0.3)

    index_in_query = {}
    for row, (query, _required) in zip(rows[1:], row_info):
        idx = index_in_query.get(query, 0)
        urls = urls_by_query[query]
        if len(row) > photo_index:
            row[photo_index] = urls[idx % len(urls)]
        index_in_query[query] = idx + 1

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerows(rows)

    print(f"\n{len(rows) - 1} produits mis a jour dans {path}")


if __name__ == "__main__":
    main()
