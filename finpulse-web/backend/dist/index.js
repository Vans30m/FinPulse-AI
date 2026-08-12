import express from 'express';
import cors from 'cors';
import compression from 'compression';
import 'dotenv/config';
import { prisma } from './prisma.js';
import searchRoutes from './routes/search.js';
import newsRoutes from './routes/news.js';
import aiRoutes from './routes/ai.js';
import assetRoutes from './routes/assets.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import watchlistRoutes from './routes/watchlists.js';
import portfolioRoutes from './routes/portfolio.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
app.use(compression());
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map(o => o.trim()));
}
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin))
            return cb(null, true);
        cb(new Error(`Blocked by CORS: ${origin}`));
    },
    credentials: true
}));
app.use(express.json());
// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'FinPulse-AI Backend API is running.',
        healthCheck: '/health',
        version: '1.0.0'
    });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'Not Set'
    });
});
// Start server immediately
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Server] running on port ${PORT}`);
});
// Test database connection in the background
prisma.$connect()
    .then(() => {
    console.log('[Database] Connected successfully');
})
    .catch((err) => {
    console.error('[Database] Connection failed:', err);
});
// Search API
app.use('/api', searchRoutes);
// News API
app.use('/api', newsRoutes);
// AI API
app.use('/api/ai', aiRoutes);
// Asset Details API
app.use('/api', assetRoutes);
// Auth API
app.use('/api/auth', authRoutes);
// Profile API
app.use('/api/profile', profileRoutes);
// Watchlist API
app.use('/api', watchlistRoutes);
// Portfolio API
app.use('/api', portfolioRoutes);
