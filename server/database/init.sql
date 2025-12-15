-- ============================================
-- SCHEMA BDD CHANDELEUR - PRODUCTION
-- Version: 1.0
-- Date: 2025-12-15
-- ============================================

DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

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
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enseigne ON participants(enseigne);
CREATE INDEX idx_magasin ON participants(magasin);
CREATE INDEX idx_session ON participants(session_id);
CREATE INDEX idx_date ON participants(date_participation);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participants
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
