/**
 * Vercel Serverless API Entry Point
 * 
 * This file is automatically deployed by Vercel as a serverless function.
 * It imports the Express app from server-vercel.js and handles each request.
 */

import app from '../server-vercel.js';
import { connectDB } from '../config/database.js';

// Ensure database connection is initialized before handling requests
let dbConnectionPromise = null;

async function ensureDbConnection() {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB();
  }
  return dbConnectionPromise;
}

// Initialize database connection on first invocation
ensureDbConnection().catch(err => {
  console.error('Failed to initialize database:', err);
});

// Export the Express app as a serverless handler
export default app;
