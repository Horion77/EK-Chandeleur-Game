const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/', async (req, res) => {
  try {
    await pool.query('DROP TABLE IF EXISTS participants CASCADE');
    await pool.query('DROP TABLE IF EXISTS admins CASCADE');
    
    await pool.query(`
      CREATE TABLE participants (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        enseigne VARCHAR(50) NOT NULL CHECK (enseigne IN ('ambiance-styles', 'culinarion')),
        magasin VARCHAR(100) NOT NULL,
        profil VARCHAR(50) CHECK (profil IN ('rassemble', 'duo', 'tradition')),
        temps_jeu1 INTEGER,
        temps_jeu2 INTEGER,
        temps_jeu3 INTEGER,
        produits_cliques JSONB DEFAULT '[]'::jsonb,
        level1_done BOOLEAN DEFAULT false,
        level2_done BOOLEAN DEFAULT false,
        level3_done BOOLEAN DEFAULT false,
        session_id UUID UNIQUE NOT NULL,
        opt_in BOOLEAN DEFAULT false,
        date_participation TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_email_enseigne UNIQUE (email, enseigne)
      )
    `);
    
    await pool.query(`
      CREATE TABLE admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query('CREATE INDEX idx_enseigne ON participants(enseigne)');
    await pool.query('CREATE INDEX idx_magasin ON participants(magasin)');
    await pool.query('CREATE INDEX idx_session ON participants(session_id)');
    
    await pool.query(`
      INSERT INTO admins (username, password_hash) 
      VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
    `);
    
    res.json({ success: true, message: '✅ Base de données initialisée !' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
