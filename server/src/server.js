const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Charger variables d'environnement AVANT les imports qui utilisent process.env
dotenv.config();

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || true),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ FRONT (static) ============
const CLIENT_DIR = path.join(__dirname, '../../client');

// Redirection root "/" selon le domaine
app.get('/', (req, res) => {
  const host = (req.headers.host || '').toLowerCase();

  if (host.includes('culinarion.fr')) {
    return res.redirect(302, '/culinarion/');
  }
  if (host.includes('ambianceetstyles.fr')) {
    return res.redirect(302, '/ambiance-styles/');
  }

  // Default (EK / Railway)
  return res.redirect(302, '/ambiance-styles/');
});

// Ambiance & Styles
app.use('/ambiance-styles', express.static(path.join(CLIENT_DIR, 'ambiance-styles')));

// Culinarion
app.use('/culinarion', express.static(path.join(CLIENT_DIR, 'culinarion')));

// Admin panel
app.use('/admin', express.static(path.join(CLIENT_DIR, 'admin-panel')));

// Optionnel : URL explicites vers les index si besoin
app.get('/ambiance-styles/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'ambiance-styles', 'index.html'));
});

app.get('/culinarion/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'culinarion', 'index.html'));
});

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'admin-panel', 'dashboard.html'));
});

// Assets partagés
app.use('/shared', express.static(path.join(CLIENT_DIR, 'shared')));

// ============ API routes ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/product-clicks', require('./routes/product-clicks'));

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

app.listen(PORT, () => {
  console.log(`Chandeleur Game running on port ${PORT}`);
});
