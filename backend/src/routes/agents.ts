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

    res.json({
      success: true,
      data: {
        agents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get public agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public agents',
    });
  }
});

// Get published agents for discovery (public endpoint)
router.get('/public/discover', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const tags = req.query.tags as string | string[];
    
    const query: any = { 
      publishStatus: PublishStatus.PUBLISHED,
      isPublic: true 
    };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    const skip = (page - 1) * limit;
    
    const [agents, total] = await Promise.all([
      Agent.find(query)
        .populate('owner', 'username email')
        .sort({ usageCount: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Agent.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        agents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Discover agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover agents',
    });
  }
});

// Apply auth middleware to protected routes
router.use(authenticate);

// Get all agents for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const tags = req.query.tags as string;
    const status = req.query.status as string;

    // Build query
    const query: any = { owner: userId };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (status && Object.values(PublishStatus).includes(status as PublishStatus)) {
      query.publishStatus = status;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const agents = await Agent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'username email');

    const total = await Agent.countDocuments(query);

    res.json({
      success: true,
      data: {
        agents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
    });
  }
});

// Get single agent by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id as string;

    const agent = await Agent.findById(id).populate('owner', 'username email');
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    // Check if user has access to this agent
    if (agent.owner._id.toString() !== userId.toString() && !agent.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent',
    });
  }
});

// Create new agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id as string;
    const validatedData = CreateAgentSchema.parse(req.body);

    const agent = new Agent({
      ...validatedData,
      owner: userId,
    });

    await agent.save();
    await agent.populate('owner', 'username email');

    res.status(201).json({
      success: true,
      data: agent,
      message: 'Agent created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agent',
    });
  }
});

// Update agent
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id as string;
    const validatedData = UpdateAgentSchema.parse(req.body);

    const agent = await Agent.findById(id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (agent.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    Object.assign(agent, validatedData);
    await agent.save();
    await agent.populate('owner', 'username email');

    res.json({
      success: true,
      data: agent,
      message: 'Agent updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent',
    });
  }
});

// Publish agent
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id as string;

    const agent = await Agent.findById(id) as IAgent;
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (agent.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Check if agent has required fields for publishing
    if (!agent.name || !agent.description || !agent.prompt) {
      return res.status(400).json({
        success: false,
        message: 'Agent must have name, description, and prompt to be published',
      });
    }

    await agent.publish();
    await agent.populate('owner', 'username email');

    res.json({
      success: true,
      data: agent,
      message: 'Agent published successfully',
    });
  } catch (error) {
    console.error('Publish agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish agent',
    });
  }
});

// Unpublish agent
router.post('/:id/unpublish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id as string;

    const agent = await Agent.findById(id) as IAgent;
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (agent.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await agent.unpublish();
    await agent.populate('owner', 'username email');

    res.json({
      success: true,
      data: agent,
      message: 'Agent unpublished successfully',
    });
  } catch (error) {
    console.error('Unpublish agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish agent',
    });
  }
});

// Archive agent
router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id as string;

    const agent = await Agent.findById(id) as IAgent;
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (agent.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await agent.archive();
    await agent.populate('owner', 'username email');

    res.json({
      success: true,
      data: agent,
      message: 'Agent archived successfully',
    });
  } catch (error) {
    console.error('Archive agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive agent',
    });
  }
});

// Delete agent
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id as string;

    const agent = await Agent.findById(id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (agent.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await Agent.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agent',
    });
  }
});

// Use agent (increment usage count)
router.post('/:id/use', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id as string;

    const agent = await Agent.findById(id) as IAgent;
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    // Check if user has access to this agent
    if (agent.owner.toString() !== userId.toString() && !agent.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Only allow usage of published agents (unless owner)
    if (agent.owner.toString() !== userId.toString() && agent.publishStatus !== PublishStatus.PUBLISHED) {
      return res.status(403).json({
        success: false,
        message: 'Agent is not published',
      });
    }

    await agent.incrementUsage();

    res.json({
      success: true,
      message: 'Agent usage recorded',
    });
  } catch (error) {
    console.error('Use agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record agent usage',
    });
  }
});

export default router;