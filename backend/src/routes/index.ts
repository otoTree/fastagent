import { Router } from 'express';
import authRoutes from './auth';
import agentRoutes from './agents';
import modelConfigRoutes from './modelConfigs';
import webhookRoutes from './webhooks';
import triggerRoutes from './triggers';
import projectRoutes from './projects';
import statsRoutes from './stats';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FastAgent API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Agent routes
router.use('/agents', agentRoutes);

// Model configuration routes
router.use('/model-configs', modelConfigRoutes);

// Webhook routes (legacy, for backward compatibility)
router.use('/webhooks', webhookRoutes);

// Trigger routes (new unified trigger system)
router.use('/triggers', triggerRoutes);

// Project routes
router.use('/projects', projectRoutes);

// Statistics routes
router.use('/stats', statsRoutes);

export default router;