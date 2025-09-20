import { Router } from 'express';
import authRoutes from './auth';
import agentRoutes from './agents';

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

export default router;