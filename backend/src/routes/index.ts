import express from 'express';
import authRoutes from './auth';
import agentRoutes from './agents';
import projectRoutes from './projects';
import modelConfigRoutes from './modelConfigs';
import triggerRoutes from './triggers';
import webhookRoutes from './webhooks';
import statsRoutes from './stats';
import taskRoutes from './tasks';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'fastagent-backend'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/agents', agentRoutes);
router.use('/projects', projectRoutes);
router.use('/model-configs', modelConfigRoutes);
router.use('/triggers', triggerRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/stats', statsRoutes);
router.use('/tasks', taskRoutes);

export default router;