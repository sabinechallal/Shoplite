package com.shoplite.catalogue.controller;

import com.shoplite.catalogue.model.Product;
import com.shoplite.catalogue.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

/**
 * API du microservice Catalogue.
 *
 * Difference cle avec l'ancien CatalogController (monolithe) :
 * - @RestController au lieu de @Controller : chaque methode renvoie
 *   directement un objet Java, que Spring transforme AUTOMATIQUEMENT en JSON.
 * - On ne renvoie plus le NOM d'une page HTML (ex: "catalogue"), car ce
 *   service ne genere plus de pages, seulement des donnees.
 * - Les autres services (ou plus tard Angular) appelleront ces routes par
 *   API pour recuperer les produits.
 */

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/produits")
public class ProductRestController {

    private final ProductRepository productRepository;

    public ProductRestController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /** GET /api/produits -> renvoie la liste de tous les produits en JSON */
    @GetMapping
    public List<Product> tousLesProduits() {
        return productRepository.findAll();
    }

    /** GET /api/produits/{id} -> renvoie un seul produit en JSON */
    @GetMapping("/{id}")
    public Product unProduit(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable : " + id));
    }

    /** GET /api/produits/recherche?q=souris -> recherche par nom (simple, insensible a la casse) */
    @GetMapping("/recherche")
    public List<Product> rechercher(@RequestParam String q) {
        return productRepository.findAll().stream()
                .filter(p -> p.getName().toLowerCase().contains(q.toLowerCase()))
                .toList();
    }
}
