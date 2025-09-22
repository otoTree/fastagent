import express from 'express';
import { authenticate } from '@/middleware/auth';
import { Agent } from '@/models/Agent';
import { Project } from '@/models/Project';
import { Trigger } from '@/models/Trigger';
import { ApiResponse } from '@/types';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get user statistics (root endpoint for compatibility)
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user!._id;
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    // Get counts for current user
    const [totalAgents, totalProjects, totalWebhooks] = await Promise.all([
      Agent.countDocuments({ owner: userId }),
      Project.countDocuments({ owner: userId }),
      Trigger.countDocuments({ owner: userId, type: 'webhook' })
    ]);

    // Get total triggers count
    const totalTriggers = await Trigger.countDocuments({ owner: userId });

    // Get monthly trigger statistics for the last 6 months
    const monthlyTriggers = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const triggerCount = await Trigger.countDocuments({
        owner: userId,
        createdAt: {
          $gte: monthStart,
          $lt: monthEnd
        }
      });

      monthlyTriggers.push({
        month: monthName,
        count: triggerCount
      });
    }

    const stats = {
      totalProjects,
      totalTriggers,
      totalWebhooks,
      totalAgents,
      monthlyTriggers
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user statistics' }
    });
  }
});

// Get user statistics (detailed endpoint)
router.get('/user', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user!._id;
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    // Get counts for current user
    const [agentCount, projectCount, webhookCount] = await Promise.all([
      Agent.countDocuments({ owner: userId }),
      Project.countDocuments({ owner: userId }),
      Trigger.countDocuments({ owner: userId, type: 'webhook' })
    ]);

    // Get monthly usage statistics
    const monthlyWebhookTriggers = await Trigger.aggregate([
      {
        $match: {
          owner: userId,
          type: 'webhook',
          lastTriggeredAt: {
            $gte: currentMonth,
            $lt: nextMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          totalTriggers: { $sum: '$triggerCount' }
        }
      }
    ]);

    const monthlyUsage = monthlyWebhookTriggers.length > 0 ? monthlyWebhookTriggers[0].totalTriggers : 0;

    const stats = {
      agentCount,
      projectCount,
      webhookCount,
      monthlyUsage,
      period: {
        start: currentMonth.toISOString(),
        end: nextMonth.toISOString()
      }
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user statistics' }
    });
  }
});

export default router;