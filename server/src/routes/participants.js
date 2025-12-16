const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST /api/participants - Créer / MAJ un participant (compatible avec ton schema)
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      enseigne,          // "ambiance-styles" ou "culinarion"
      magasin,
      profil,            // "rassemble" | "duo" | "tradition"
      temps_jeu1,
      temps_jeu2,
      temps_jeu3,
      produits_cliques,  // array -> jsonb
      level1_done,
      level2_done,
      level3_done,
      session_id,        // uuid string
      opt_in
    } = req.body;

    if (!nom || !prenom || !email || !enseigne || !magasin || !session_id) {
      return res.status(400).json({ error: 'Champs requis: nom, prenom, email, enseigne, magasin, session_id' });
    }

    const query = `
      INSERT INTO participants (
        nom, prenom, email, enseigne, magasin, profil,
        temps_jeu1, temps_jeu2, temps_jeu3,
        produits_cliques,
        level1_done, level2_done, level3_done,
        session_id, opt_in
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        $10::jsonb,
        $11, $12, $13,
        $14::uuid, $15
      )
      ON CONFLICT (email, enseigne)
      DO UPDATE SET
        nom = EXCLUDED.nom,
        prenom = EXCLUDED.prenom,
        magasin = EXCLUDED.magasin,
        profil = EXCLUDED.profil,
        temps_jeu1 = EXCLUDED.temps_jeu1,
        temps_jeu2 = EXCLUDED.temps_jeu2,
        temps_jeu3 = EXCLUDED.temps_jeu3,
        produits_cliques = EXCLUDED.produits_cliques,
        level1_done = EXCLUDED.level1_done,
        level2_done = EXCLUDED.level2_done,
        level3_done = EXCLUDED.level3_done,
        session_id = EXCLUDED.session_id,
        opt_in = EXCLUDED.opt_in,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      nom,
      prenom,
      email,
      enseigne,
      magasin,
      profil || null,
      Number.isFinite(temps_jeu1) ? temps_jeu1 : null,
      Number.isFinite(temps_jeu2) ? temps_jeu2 : null,
      Number.isFinite(temps_jeu3) ? temps_jeu3 : null,
      JSON.stringify(Array.isArray(produits_cliques) ? produits_cliques : []),
      !!level1_done,
      !!level2_done,
      !!level3_done,
      session_id,
      !!opt_in
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erreur POST /api/participants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
