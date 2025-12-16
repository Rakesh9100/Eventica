import dotenv from 'dotenv';
import { app } from './app.js';
import mongodb from '../config/mongodb.js';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Eventica backend...');
console.log('🔍 Environment check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 Environment check - SECRET_KEY exists:', !!process.env.SECRET_KEY);

// For Vercel serverless functions
export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection is ready (singleton pattern handles this)
    await mongodb.connect();
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
