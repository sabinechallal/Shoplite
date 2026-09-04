package com.shoplite.catalogue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entree du microservice Catalogue.
 * Contrairement a l'ancienne application ShopLite (monolithe), ce service
 * ne fait qu'UNE seule chose : gerer les produits, et repondre en JSON.
 * Lancement : executer main(), puis appeler http://localhost:8081/api/produits
 */
@SpringBootApplication
public class CatalogueServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogueServiceApplication.class, args);
    }

}
