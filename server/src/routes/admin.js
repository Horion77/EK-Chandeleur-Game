const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const login = (email || username || '').trim();

    if (!login || !password) {
      return res.status(400).json({ error: 'Champs manquants (email/username, password)' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, password_hash FROM admins WHERE username = $1 LIMIT 1',
      [login]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);

    if (!ok) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET manquant côté serveur' });
    }

    const token = jwt.sign(
      { sub: admin.id, role: 'admin', username: admin.username },
      secret,
      { expiresIn: '12h' }
    );

    return res.json({ token });
  } catch (e) {
    console.error('Admin login error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
