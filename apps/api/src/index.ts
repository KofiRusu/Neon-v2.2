import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger } from '@neon/utils';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NeonHub AI Marketing Ecosystem API',
    version: '0.2.0',
  });
});

// Basic API routes
app.get('/api/status', (_req, res) => {
  res.json({
    message: 'NeonHub AI Marketing Ecosystem API is running',
    agents: {
      content: 'active',
      ad: 'active',
      outreach: 'idle',
      trend: 'active',
      insight: 'active',
      design: 'idle',
    },
    metrics: {
      totalCampaigns: 12,
      activeAgents: 4,
      roi: '3.2x',
      leadsGenerated: 1247,
    },
  });
});

// Agent status endpoint
app.get('/api/agents', (_req, res) => {
  res.json({
    agents: [
      {
        id: 'content',
        name: 'Content Agent',
        status: 'active',
        lastExecution: new Date().toISOString(),
      },
      { id: 'ad', name: 'Ad Agent', status: 'active', lastExecution: new Date().toISOString() },
      { id: 'outreach', name: 'Outreach Agent', status: 'idle', lastExecution: null },
      {
        id: 'trend',
        name: 'Trend Agent',
        status: 'active',
        lastExecution: new Date().toISOString(),
      },
      {
        id: 'insight',
        name: 'Insight Agent',
        status: 'active',
        lastExecution: new Date().toISOString(),
      },
      { id: 'design', name: 'Design Agent', status: 'idle', lastExecution: null },
    ],
  });
});

// Campaigns endpoint
app.get('/api/campaigns', (_req, res) => {
  res.json({
    campaigns: [
      {
        id: 'campaign-1',
        name: 'Summer Neon Collection',
        status: 'active',
        type: 'social_media',
        budget: 5000,
        roi: 3.2,
        startDate: '2024-06-01',
        endDate: '2024-08-31',
      },
      {
        id: 'campaign-2',
        name: 'B2B Outreach Q3',
        status: 'active',
        type: 'email',
        budget: 2000,
        roi: 4.1,
        startDate: '2024-07-01',
        endDate: '2024-09-30',
      },
    ],
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('API Error', { error: err.message, stack: err.stack }, 'APIServer');
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(
    `🚀 NeonHub AI Marketing Ecosystem API running on port ${PORT}`,
    {
      port: PORT,
      endpoints: {
        health: `http://localhost:${PORT}/health`,
        status: `http://localhost:${PORT}/api/status`,
        agents: `http://localhost:${PORT}/api/agents`,
        campaigns: `http://localhost:${PORT}/api/campaigns`,
      },
    },
    'APIServer'
  );
});
