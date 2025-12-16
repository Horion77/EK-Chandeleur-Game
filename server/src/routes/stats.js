const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/stats - Statistiques (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const global = await pool.query(`
      SELECT
        COUNT(*)::int AS total_participants,
        COUNT(*) FILTER (WHERE level1_done = true)::int AS level1_done_count,
        COUNT(*) FILTER (WHERE level2_done = true)::int AS level2_done_count,
        COUNT(*) FILTER (WHERE level3_done = true)::int AS level3_done_count,
        COUNT(*) FILTER (WHERE level1_done AND level2_done AND level3_done)::int AS all_levels_done_count,
        AVG(temps_jeu1)::float AS avg_temps_jeu1,
        AVG(temps_jeu2)::float AS avg_temps_jeu2,
        AVG(temps_jeu3)::float AS avg_temps_jeu3
      FROM participants
    `);

    const byEnseigne = await pool.query(`
      SELECT
        enseigne,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE level1_done AND level2_done AND level3_done)::int AS completes,
        COUNT(*) FILTER (WHERE opt_in = true)::int AS opt_in_count
      FROM participants
      GROUP BY enseigne
      ORDER BY enseigne
    `);

    const byProfil = await pool.query(`
      SELECT profil, COUNT(*)::int AS total
      FROM participants
      WHERE profil IS NOT NULL
      GROUP BY profil
      ORDER BY total DESC
    `);

    res.json({
      global: global.rows[0],
      byEnseigne: byEnseigne.rows,
      byProfil: byProfil.rows
    });
  } catch (error) {
    console.error('Erreur GET stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
