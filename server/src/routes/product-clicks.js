const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * POST /api/product-clicks
 * 
 * Endpoint de tracking des clics produits en temps réel.
 * Appelé via navigator.sendBeacon() depuis le frontend.
 * 
 * Body attendu :
 * {
 *   session_id: "uuid-session",
 *   product_name: "Poêle à crêpes",
 *   product_url: "https://...",
 *   profil: "precision",
 *   enseigne: "culinarion"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { session_id, product_name, product_url, profil, enseigne } = req.body;

    // Validation des champs obligatoires
    if (!session_id || !product_name || !product_url || !enseigne) {
      console.warn('[Product Clicks] Champs manquants:', req.body);
      // On retourne 200 quand même pour ne pas bloquer l'UX côté client
      return res.status(200).json({ 
        success: false, 
        error: 'Champs obligatoires manquants' 
      });
    }

    // Validation de l'enseigne (sécurité)
    if (!['culinarion', 'ambiance-styles'].includes(enseigne)) {
      console.warn('[Product Clicks] Enseigne invalide:', enseigne);
      return res.status(200).json({ 
        success: false, 
        error: 'Enseigne invalide' 
      });
    }

    // Insert du clic dans la table product_clicks
    const query = `
      INSERT INTO product_clicks 
        (session_id, product_name, product_url, profil, enseigne, clicked_at)
      VALUES 
        ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `;

    const values = [
      session_id,
      product_name,
      product_url,
      profil || null, // NULL si profil pas encore déterminé
      enseigne
    ];

    const result = await pool.query(query, values);

    // Log de succès pour monitoring
    console.log(`[Product Clicks] ✓ Clic tracké - ID: ${result.rows[0].id}, Produit: "${product_name}", Profil: ${profil || 'N/A'}, Enseigne: ${enseigne}`);

    // Réponse succès
    res.status(200).json({
      success: true,
      click_id: result.rows[0].id
    });

  } catch (error) {
    // Log de l'erreur pour debug
    console.error('[Product Clicks] ✗ Erreur lors du tracking:', error);
    
    // On retourne 200 même en cas d'erreur pour ne pas perturber l'UX
    // Le tracking est un "nice to have", pas une fonctionnalité critique
    res.status(200).json({
      success: false,
      error: 'Erreur serveur lors du tracking'
    });
  }
});

module.exports = router;
