import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Agent, CreateAgentSchema, UpdateAgentSchema, PublishAgentSchema, PublishStatus, IAgent } from '@/models/Agent';
import { authenticate, optionalAuth } from '@/middleware/auth';

const router = Router();

// Public routes (no auth required)
// Get public agents (only published ones)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const tags = req.query.tags as string;

    // Build query for published public agents only
    const query: any = { 
      isPublic: true, 
      publishStatus: PublishStatus.PUBLISHED 
    };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;
    
    const [agents, total] = await Promise.all([
      Agent.find(query)
        .populate('owner', 'username email')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Agent.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        agents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get public agents for discovery (no auth required)
router.get('/public/discover', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    
    // Get featured agents (most used or recently published)
    const featuredAgents = await Agent.find({
      isPublic: true,
      publishStatus: PublishStatus.PUBLISHED
    })
      .populate('owner', 'username email')
      .sort({ usageCount: -1, publishedAt: -1 })
      .limit(limit);

    // Get trending tags
    const trendingTags = await Agent.aggregate([
      { $match: { isPublic: true, publishStatus: PublishStatus.PUBLISHED } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    return res.json({
      success: true,
      data: {
        featuredAgents,
        trendingTags
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Apply auth middleware to protected routes
router.use(authenticate);

// Get all agents for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = { owner: req.user!._id };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (status) {
      query.publishStatus = status;
    }

    const skip = (page - 1) * limit;
    
    const [agents, total] = await Promise.all([
      Agent.find(query)
        .populate('owner', 'username email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Agent.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        agents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get agent by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      owner: req.user!._id
    }).populate('owner', 'username email');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Create agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateAgentSchema.parse(req.body);
    
    const agent = new Agent({
      ...validatedData,
      owner: req.user!._id
    });
    
    await agent.save();
    await agent.populate('owner', 'username email');

    return res.status(201).json({
      success: true,
      data: agent
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.errors
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Update agent
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateAgentSchema.parse(req.body);
    
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      validatedData,
      { new: true }
    ).populate('owner', 'username email');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.errors
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Publish agent
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const validatedData = PublishAgentSchema.parse(req.body);
    
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      {
        ...validatedData,
        publishStatus: PublishStatus.PUBLISHED,
        publishedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'username email');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.errors
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Unpublish agent
router.post('/:id/unpublish', async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      {
        publishStatus: PublishStatus.DRAFT,
        isPublic: false,
        publishedAt: null
      },
      { new: true }
    ).populate('owner', 'username email');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Archive agent
router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      {
        publishStatus: PublishStatus.ARCHIVED,
        isPublic: false
      },
      { new: true }
    ).populate('owner', 'username email');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Delete agent
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findOneAndDelete({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    return res.json({
      success: true,
      data: { message: 'Agent deleted successfully' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Track agent usage
router.post('/:id/use', async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { usageCount: 1 },
        lastUsedAt: new Date()
      },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    return res.json({
      success: true,
      data: { message: 'Usage tracked successfully' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;