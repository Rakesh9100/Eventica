import dotenv from 'dotenv';
import mongodb from './config/mongodb.js';
import { app } from './api/app.js';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Eventica backend locally...');
console.log('🔍 Environment check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 Environment check - SECRET_KEY exists:', !!process.env.SECRET_KEY);

// Local development server
const startServer = async () => {
  try {
    // Connect to MongoDB for local development
    await mongodb.connect();
    console.log('✅ MongoDB connected for local development');

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Eventica backend running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api/v1`);
      console.log(`🔗 Test: http://localhost:${PORT}/api/v1/event/allevents`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/v1/event/health`);
      console.log(`📝 Admin panel will connect to this local backend`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();