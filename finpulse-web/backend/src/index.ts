import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import 'dotenv/config';
import { prisma } from './prisma.js';
import searchRoutes from './routes/search.js';
import newsRoutes from './routes/news.js';
import aiRoutes from './routes/ai.js';
import assetRoutes from './routes/assets.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map(o => o.trim()));
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'Not Set'
  });
});

// Test database connection and start server
prisma.$connect()
  .then(() => {
    console.log('[Database] Connected successfully');
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`[Server] running on port ${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error('[Database] Connection failed:', err);
    process.exit(1);
  });
  
// Search API
app.use('/api', searchRoutes);

// News API
app.use('/api', newsRoutes);

// AI API
app.use('/api/ai', aiRoutes);

// Asset Details API
app.use('/api', assetRoutes);