const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Token manquant' });

  try {
    const decoded = jwt.verify(m[1], JWT_SECRET);
    if (decoded?.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    req.admin = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// -----------------------------------------------------------------------------
// PUBLIC
// POST /api/participants - Inscription / sauvegarde
// -----------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      enseigne,
      magasin,
      profil,
      session_id,
      opt_in,
      produits_cliques,
      level1_done,
      level2_done,
      level3_done
    } = req.body;

    if (!nom || !prenom || !email || !enseigne || !magasin) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    // Validation enseigne
    if (!['ambiance-styles', 'culinarion'].includes(enseigne)) {
      return res.status(400).json({ error: "Enseigne invalide." });
    }

    // Validation profil (optionnel)
    const validProfils = ['rassemble', 'duo', 'tradition', 'precision', 'sarrasin', 'creative'];
    if (profil && !validProfils.includes(profil)) {
      return res.status(400).json({ error: "Profil invalide." });
    }

    // Insert dans la table participants
    const query = `
      INSERT INTO participants
      (nom, prenom, email, enseigne, magasin, profil, session_id, opt_in, produits_cliques, level1_done, level2_done, level3_done)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (email, enseigne) 
      DO UPDATE SET 
        nom = EXCLUDED.nom,
        prenom = EXCLUDED.prenom,
        magasin = EXCLUDED.magasin,
        profil = EXCLUDED.profil,
        opt_in = EXCLUDED.opt_in,
        produits_cliques = EXCLUDED.produits_cliques,
        level1_done = EXCLUDED.level1_done,
        level2_done = EXCLUDED.level2_done,
        level3_done = EXCLUDED.level3_done,
        updated_at = NOW()
      RETURNING id
    `;

    const values = [
      nom,
      prenom,
      email,
      enseigne,
      magasin,
      profil || null,
      session_id,
      opt_in || false,
      JSON.stringify(produits_cliques || []),
      level1_done || false,
      level2_done || false,
      level3_done || false
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      participant_id: result.rows[0].id
    });

  } catch (error) {
    console.error("Erreur inscription participant:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// -----------------------------------------------------------------------------
// ADMIN (JWT) - Listing + suppression
// GET /api/participants?page=&limit=&q=&enseigne=&optin=&sort=&dir=
// DELETE /api/participants/:id
// -----------------------------------------------------------------------------
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 200);
    const offset = (page - 1) * limit;

    const q = (req.query.q || '').trim();
    const enseigne = (req.query.enseigne || '').trim();
    const optinRaw = (req.query.optin ?? '').toString().trim();
    const sortRaw = (req.query.sort || 'created_at').toString();
    const dirRaw = (req.query.dir || 'desc').toString().toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // whitelist tri (anti SQLi)
    const sortMap = {
      created_at: 'created_at',
      date_participation: 'date_participation',
      nom: 'nom',
      prenom: 'prenom',
      email: 'email',
      enseigne: 'enseigne',
      opt_in: 'opt_in'
    };
    const sortCol = sortMap[sortRaw] || 'created_at';

    const where = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      where.push(`(nom ILIKE $${params.length} OR prenom ILIKE $${params.length} OR email ILIKE $${params.length} OR magasin ILIKE $${params.length})`);
    }

    if (enseigne) {
      params.push(enseigne);
      where.push(`enseigne = $${params.length}`);
    }

    if (optinRaw === 'true' || optinRaw === 'false') {
      params.push(optinRaw === 'true');
      where.push(`opt_in = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM participants ${whereSql}`,
      params
    );
    const total = countRes.rows[0]?.total ?? 0;

    params.push(limit);
    params.push(offset);

    const rowsRes = await pool.query(
      `SELECT id, nom, prenom, email, enseigne, magasin, profil, opt_in, created_at, date_participation
       FROM participants
       ${whereSql}
       ORDER BY ${sortCol} ${dirRaw}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ rows: rowsRes.rows, total });

  } catch (error) {
    console.error('Erreur GET /api/participants (admin):', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID invalide' });

    const del = await pool.query('DELETE FROM participants WHERE id = $1 RETURNING id', [id]);
    if (!del.rows.length) return res.status(404).json({ error: 'Introuvable' });

    res.json({ ok: true, id: del.rows[0].id });

  } catch (error) {
    console.error('Erreur DELETE /api/participants/:id (admin):', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
