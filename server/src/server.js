import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initDatabase } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect and initialize MySQL tables
  await initDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FunFlick Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
