package com.shoplite.catalogue.repository;

import com.shoplite.catalogue.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acces a la base pour les produits. Spring Data JPA genere l'implementation
 * automatiquement (findAll, findById, save, ...), on n'a rien a coder ici.
 */
public interface ProductRepository extends JpaRepository<Product, Long> {
}
