import dotenv from 'dotenv';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Load database connections
import { connectDB } from './config/database';

// Import routes
import keyRoutes from './routes/key.routes';
import useCaseRoutes from './routes/useCase.routes';
import environmentRoutes from './routes/environment.routes';

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI_DEV', 'MONGODB_URI_STAGING', 'MONGODB_URI_PROD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/keys', keyRoutes);
app.use('/api/use-cases', useCaseRoutes);
app.use('/api/environments', environmentRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server only if MongoDB connection is successful
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB (default to development environment)
    await connectDB('development');
    
    // Start server
    const PORT: number = parseInt(process.env.PORT || '5000', 10);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 