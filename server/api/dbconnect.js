import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
export const dbConnect = async () => {
  const url = process.env.MONGO_URI;

  console.log('Attempting to connect to MongoDB...');
  console.log('MONGO_URI exists:', !!url);
  
  if (!url) {
    console.error('MONGO_URI environment variable is not set');
    throw new Error('MONGO_URI environment variable is not set');
  }

  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Database connection error:', err.message);
    throw err; // Don't exit process in serverless environment
  }
};
