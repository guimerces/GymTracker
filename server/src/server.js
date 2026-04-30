require('dotenv').config();
const app = require('./app');
const { initDb, closeDb } = require('./database/db');

const PORT = process.env.PORT || 3000;

async function start() {
    // Initialize database (async because sql.js needs to load WASM)
    await initDb();

    // Start server
    const server = app.listen(PORT, () => {
        console.log(`
  ╔═══════════════════════════════════════╗
  ║    🏋️  GymTracker API v1.0           ║
  ║    Running on http://localhost:${PORT}   ║
  ╚═══════════════════════════════════════╝
        `);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        closeDb();
        server.close(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
        closeDb();
        server.close(() => process.exit(0));
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
