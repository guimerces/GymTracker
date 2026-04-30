const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const workoutsRoutes = require('./modules/workouts/workouts.routes');
const exercisesRoutes = require('./modules/exercises/exercises.routes');
const sessionsRoutes = require('./modules/sessions/sessions.routes');
const statsRoutes = require('./modules/stats/stats.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '..', '..', 'client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api', exercisesRoutes); // mounted at /api because routes include /workouts/:id/exercises and /exercises/:id
app.use('/api/sessions', sessionsRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', '..', 'client', 'index.html'));
    }
});

// Error handling (must be last)
app.use(errorHandler);

module.exports = app;
