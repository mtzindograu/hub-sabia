/**
 * MongoDB Database Configuration
 * Handles MongoDB connection with Mongoose ODM
 *
 * @description Configures MongoDB connection for the application
 *              Optimized for both local development and Vercel serverless
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MongoDB URI. Please add MONGODB_URI to your .env file.');
}

// Cache the database connection for serverless environments
// This prevents opening a new connection on every serverless invocation
const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';

let cachedConnection = null;
let connectionPromise = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<mongoose.Connection>} Database connection
 */
export async function connectDB() {
  // Return cached connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  // Reuse existing connection promise to prevent multiple simultaneous connections
  if (connectionPromise) {
    console.log('⏳ Waiting for existing MongoDB connection...');
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      console.log('🔄 Connecting to MongoDB...');

      const options = {
        // Connection pool settings
        maxPoolSize: isServerless ? 5 : 10,
        minPoolSize: isServerless ? 1 : 5,
        serverSelectionTimeoutMS: isServerless ? 10000 : 5000,
        socketTimeoutMS: 45000,

        // Auto-reconnection settings
        retryWrites: true,
        retryReads: true,
      };

      await mongoose.connect(MONGODB_URI, options);

      cachedConnection = mongoose.connection;

      // Event listeners
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        cachedConnection = null;
        connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
        cachedConnection = null;
        connectionPromise = null;
      });

      console.log('✅ MongoDB connected successfully!');
      console.log(`📊 Database: ${mongoose.connection.name}`);

      return cachedConnection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cachedConnection = null;
    connectionPromise = null;
    console.log('🔒 MongoDB disconnected');
  }
}

/**
 * Get current connection status
 * @returns {boolean} True if connected
 */
export function isConnected() {
  return mongoose.connection.readyState === 1;
}

export default {
  connectDB,
  disconnectDB,
  isConnected,
};
