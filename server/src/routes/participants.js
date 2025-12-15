const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/participants - Liste tous les participants
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, e.nom as enseigne_nom 
      FROM participants p
      LEFT JOIN enseignes e ON p.enseigne_id = e.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET participants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/participants - Créer un participant
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, enseigne_id } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({ error: 'Nom, prénom et email requis' });
    }

    const result = await pool.query(
      `INSERT INTO participants (nom, prenom, email, telephone, enseigne_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nom, prenom, email, telephone, enseigne_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    console.error('Erreur POST participant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
