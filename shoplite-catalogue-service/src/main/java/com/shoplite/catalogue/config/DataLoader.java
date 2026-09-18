
package com.shoplite.catalogue.config;

import com.shoplite.catalogue.model.Product;
import com.shoplite.catalogue.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@Component
public class DataLoader implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataLoader(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) throws IOException {
        if (productRepository.count() > 0) {
            return;
        }

        ClassPathResource fichierCsv = new ClassPathResource("data/produits.csv");

        try (InputStream flux = fichierCsv.getInputStream();
             BufferedReader lecteur = new BufferedReader(new InputStreamReader(flux, StandardCharsets.UTF_8))) {

            String ligne;
            boolean premiereLigne = true;
            int nombreCharges = 0;

            while ((ligne = lecteur.readLine()) != null) {
                if (premiereLigne) {
                    premiereLigne = false;
                    continue;
                }
                if (ligne.isBlank()) {
                    continue;
                }

                String[] colonnes = ligne.split(";", -1);
                if (colonnes.length < 5) {
                    System.out.println("[Catalogue] Ligne CSV ignoree (format invalide) : " + ligne);
                    continue;
                }

                String nom = colonnes[0].trim();
                String description = colonnes[1].trim();
                String prixTexte = colonnes[2].trim().replace(",", ".");
                String photo = colonnes[3].trim();
                String categorie = colonnes[4].trim();

                try {
                    BigDecimal prix = new BigDecimal(prixTexte);
                    productRepository.save(new Product(nom, description, prix, photo, categorie));
                    nombreCharges++;
                } catch (NumberFormatException e) {
                    System.out.println("[Catalogue] Ligne CSV ignoree (prix invalide '" + prixTexte + "') : " + ligne);
                }
            }

            System.out.println("[Catalogue] " + nombreCharges + " produit(s) charge(s) depuis produits.csv");
        }
    }
}
