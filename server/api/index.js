import dotenv from 'dotenv';
import { dbConnect } from './dbconnect.js';
import { app } from './app.js';

// Load environment variables
dotenv.config();

console.log('Starting Eventica backend...');
console.log('Environment check - MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('Environment check - SECRET_KEY exists:', !!process.env.SECRET_KEY);

// For Vercel serverless functions, we need to handle this differently
export default async function handler(req, res) {
  try {
    // Connect to database on each request (serverless pattern)
    await dbConnect();
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
