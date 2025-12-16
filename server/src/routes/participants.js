const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/participants - Liste tous les participants (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM participants
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET participants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/participants - Créer un participant (public)
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      enseigne,
      magasin,
      profil,
      temps_jeu1,
      temps_jeu2,
      temps_jeu3,
      produits_cliques,
      level1_done,
      level2_done,
      level3_done,
      session_id,
      opt_in
    } = req.body;

    // Champs NOT NULL dans ta BDD
    if (!nom || !prenom || !email || !enseigne || !magasin || !session_id) {
      return res.status(400).json({ error: 'Champs requis: nom, prenom, email, enseigne, magasin, session_id' });
    }

    const result = await pool.query(
      `INSERT INTO participants (
        nom, prenom, email, enseigne, magasin, profil,
        temps_jeu1, temps_jeu2, temps_jeu3,
        produits_cliques,
        level1_done, level2_done, level3_done,
        session_id, opt_in
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,
        COALESCE($10::jsonb, '[]'::jsonb),
        COALESCE($11,false), COALESCE($12,false), COALESCE($13,false),
        $14::uuid, COALESCE($15,false)
      )
      RETURNING *`,
      [
        nom, prenom, email, enseigne, magasin, profil || null,
        temps_jeu1 ?? null, temps_jeu2 ?? null, temps_jeu3 ?? null,
        JSON.stringify(produits_cliques ?? []),
        !!level1_done, !!level2_done, !!level3_done,
        session_id, !!opt_in
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // unique (email, enseigne) OU session_id unique
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflit: email déjà utilisé pour cette enseigne, ou session_id déjà existant' });
    }
    // check constraint enseigne/profil
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Valeur invalide (enseigne ou profil)' });
    }
    console.error('Erreur POST participant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
