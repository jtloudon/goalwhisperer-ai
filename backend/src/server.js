import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRoutes from './routes/api.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'OKR API Server',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      objectives: '/api/objectives/annual',
      progress: '/api/tracking/progress',
      completed: '/api/tracking/completed',
      plans: '/api/plans',
    },
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 OKR API Server running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 Dashboard data: http://localhost:${PORT}/api/dashboard`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});
