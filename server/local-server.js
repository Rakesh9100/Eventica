import dotenv from 'dotenv';
import { dbConnect } from './api/dbconnect.js';
import { app } from './api/app.js';

// Load environment variables
dotenv.config();

console.log('Starting Eventica backend locally...');
console.log('Environment check - MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('Environment check - SECRET_KEY exists:', !!process.env.SECRET_KEY);

// Local development server
const startServer = async () => {
  try {
    // Skip database connection for local development since we're using file storage
    console.log('⚠️  Skipping MongoDB connection for local development (using file storage)');

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Eventica backend running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api/v1`);
      console.log(`🔗 Test: http://localhost:${PORT}/api/v1/event/allevents`);
      console.log(`📝 Admin panel will connect to this local backend`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();