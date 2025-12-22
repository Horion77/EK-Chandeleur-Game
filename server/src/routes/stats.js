const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/stats - Statistiques globales (admin)
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

// ⭐ NOUVELLE ROUTE : GET /api/stats/product-clicks - Stats clics produits (admin)
router.get('/product-clicks', authMiddleware, async (req, res) => {
  try {
    const enseigne = req.query.enseigne || null; // Filtre optionnel par enseigne
    
    // Construction de la clause WHERE dynamique
    const whereClause = enseigne ? `WHERE enseigne = $1` : '';
    const params = enseigne ? [enseigne] : [];

    // Top 10 produits les plus cliqués
    const topProducts = await pool.query(`
      SELECT 
        product_name,
        COUNT(*)::int AS clicks,
        COUNT(DISTINCT session_id)::int AS unique_users
      FROM product_clicks
      ${whereClause}
      GROUP BY product_name
      ORDER BY clicks DESC
      LIMIT 10
    `, params);

    // Répartition des clics par profil
    const clicksByProfil = await pool.query(`
      SELECT 
        profil,
        COUNT(*)::int AS clicks
      FROM product_clicks
      ${whereClause}
      GROUP BY profil
      ORDER BY clicks DESC
    `, params);

    // Répartition des clics par enseigne (si pas de filtre)
    let clicksByEnseigne = { rows: [] };
    if (!enseigne) {
      clicksByEnseigne = await pool.query(`
        SELECT 
          enseigne,
          COUNT(*)::int AS clicks,
          COUNT(DISTINCT session_id)::int AS unique_users
        FROM product_clicks
        GROUP BY enseigne
        ORDER BY clicks DESC
      `);
    }

    // Matrice produit x profil (pour voir quel profil clique quoi)
    const productProfilMatrix = await pool.query(`
      SELECT 
        product_name,
        profil,
        COUNT(*)::int AS clicks
      FROM product_clicks
      ${whereClause}
      GROUP BY product_name, profil
      ORDER BY product_name, clicks DESC
    `, params);

    // Taux de clic global (% de participants qui cliquent)
    const clickRate = await pool.query(`
      SELECT 
        COUNT(DISTINCT pc.session_id)::int AS users_qui_cliquent,
        (SELECT COUNT(*)::int FROM participants ${whereClause.replace('enseigne', 'p.enseigne')}) AS total_participants,
        CASE 
          WHEN (SELECT COUNT(*) FROM participants ${whereClause.replace('enseigne', 'p.enseigne')}) > 0 
          THEN ROUND(
            COUNT(DISTINCT pc.session_id)::numeric / 
            (SELECT COUNT(*) FROM participants ${whereClause.replace('enseigne', 'p.enseigne')})::numeric * 100, 
            2
          )
          ELSE 0
        END AS taux_clic_pourcent
      FROM product_clicks pc
      ${whereClause}
    `, params);

    // Stats temporelles (clics par jour sur les 30 derniers jours)
    const clicksByDay = await pool.query(`
      SELECT 
        DATE(clicked_at) AS jour,
        COUNT(*)::int AS clicks
      FROM product_clicks
      WHERE clicked_at >= NOW() - INTERVAL '30 days'
      ${enseigne ? 'AND enseigne = $1' : ''}
      GROUP BY jour
      ORDER BY jour DESC
      LIMIT 30
    `, params);

    res.json({
      topProducts: topProducts.rows,
      clicksByProfil: clicksByProfil.rows,
      clicksByEnseigne: clicksByEnseigne.rows,
      productProfilMatrix: productProfilMatrix.rows,
      clickRate: clickRate.rows[0],
      clicksByDay: clicksByDay.rows
    });

  } catch (error) {
    console.error('Erreur GET stats/product-clicks:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
