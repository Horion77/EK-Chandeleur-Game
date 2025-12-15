const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/stats - Statistiques globales
router.get('/', authMiddleware, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_participants,
        COUNT(CASE WHEN completed = true THEN 1 END) as completed_count,
        AVG(score) as score_moyen,
        AVG(temps_total) as temps_moyen,
        MAX(score) as meilleur_score
      FROM participants
    `);

    res.json({ global: stats.rows[0] });
  } catch (error) {
    console.error('Erreur GET stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
