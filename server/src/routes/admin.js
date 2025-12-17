const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");

const router = express.Router();

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "7d";

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body || {};

    // Ton front envoie email: "...", password: "..."
    // Ta BDD a une colonne "username". On accepte email OU username.
    const login = (email || username || "").trim().toLowerCase();
    const pwd = (password || "").toString();

    if (!login || !pwd) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    // Table admins: username, password_hash
    const { rows } = await pool.query(
      `SELECT id, username, password_hash
       FROM admins
       WHERE LOWER(username) = $1
       LIMIT 1`,
      [login]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const admin = rows[0];

    const ok = await bcrypt.compare(pwd, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { sub: admin.id, username: admin.username, role: "admin" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
