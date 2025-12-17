const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");

const router = express.Router();

/**
 * Détection simple d’un hash bcrypt
 */
function looksLikeBcryptHash(str) {
  return typeof str === "string" && str.startsWith("$2");
}

/**
 * POST /api/admin/login
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email ou mot de passe manquant" });
    }

    const result = await pool.query(
      "SELECT id, username, password_hash FROM admins WHERE username = $1 LIMIT 1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const admin = result.rows[0];

    let isValid = false;

    // Cas 1 : mot de passe déjà hashé
    if (looksLikeBcryptHash(admin.password_hash)) {
      isValid = await bcrypt.compare(password, admin.password_hash);
    }
    // Cas 2 : ancien mot de passe en clair (test123)
    else {
      isValid = password === admin.password_hash;
    }

    if (!isValid) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    /**
     * Migration automatique vers bcrypt
     */
    if (!looksLikeBcryptHash(admin.password_hash)) {
      const newHash = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE admins SET password_hash = $1 WHERE id = $2",
        [newHash, admin.id]
      );
      console.log(`🔐 Admin ${email} migré vers bcrypt`);
    }

    /**
     * JWT simple (24h)
     */
    const token = jwt.sign(
      { adminId: admin.id, email: admin.username },
      process.env.JWT_SECRET || "dev_secret_change_me",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.username
      }
    });

  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
