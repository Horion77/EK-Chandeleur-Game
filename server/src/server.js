const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database');

// Charger variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/stats', require('./routes/stats'));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🥞 API Chandeleur Game - Online',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      participants: '/api/participants',
      stats: '/api/stats'
    }
  });
});

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
║  🥞 API Chandeleur Game          ║
║  Port: ${PORT}                      ║
║  Environment: ${process.env.NODE_ENV || 'development'} ║
╚═══════════════════════════════════╝
  `);
});
