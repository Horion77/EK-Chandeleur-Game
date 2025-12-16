const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const pool = require('./config/database');

// Charger variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ FRONT (static) ============
// Chemin vers /client depuis /server/src (ton server.js est dans server/src/)
const CLIENT_DIR = path.join(__dirname, '../../client');

// Ambiance & Styles
app.use('/ambiance-styles', express.static(path.join(CLIENT_DIR, 'ambiance-styles')));

// Culinarion (quand tu auras les fichiers)
app.use('/culinarion', express.static(path.join(CLIENT_DIR, 'culinarion')));

// Admin panel
app.use('/admin', express.static(path.join(CLIENT_DIR, 'admin-panel')));

// Optionnel : racine => redirection vers le jeu
app.get('/', (req, res) => {
  // si tu préfères garder le JSON "API online", enlève cette redirection
  res.redirect('/ambiance-styles/');
});

// (Optionnel) URL explicites vers les index si besoin
app.get('/ambiance-styles/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'ambiance-styles', 'index.html'));
});

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'admin-panel', 'dashboard.html'));
});

// ============ API routes ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/stats', require('./routes/stats'));

// Health check pour Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'disconnected'
  });
});

// Gestion 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════╗
║  🥞 Chandeleur Game (API + Web)   ║
║  Port: ${PORT}                     ║
║  Environment: ${process.env.NODE_ENV || 'development'} ║
╚═══════════════════════════════════╝
  `);
});
