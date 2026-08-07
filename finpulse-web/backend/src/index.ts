import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Bind to 0.0.0.0 for Render compatibility
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Server] running on port ${PORT}`);
});
