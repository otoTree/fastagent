import express from 'express';
import { authenticate } from '@/middleware/auth';
import { Trigger, CreateTriggerSchema, UpdateTriggerSchema, TriggerType, TriggerStatus } from '@/models/Trigger';
import { Project } from '@/models/Project';
import { Agent } from '@/models/Agent';
import { ApiResponse, PaginationQuery } from '@/types';
import { z } from 'zod';

const router = express.Router();

// Create trigger
router.post('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = CreateTriggerSchema.parse(req.body);
    
    // Check if project exists and belongs to user
    const project = await Project.findOne({ 
      _id: validatedData.projectId, 
      owner: req.user!._id 
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' }
      });
    }

    // Check if agent exists and belongs to user
    const agent = await Agent.findOne({ 
      _id: validatedData.agentId, 
      owner: req.user!._id 
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      });
    }

    // Create trigger
    const trigger = new Trigger({
      ...validatedData,
      owner: req.user!._id,
    });
    
    await trigger.save();
    
    // Add trigger to project
    await project.addWebhookTrigger((trigger as any)._id.toString());
    
    await trigger.populate(['projectId', 'agentId', 'owner']);
    
    return res.status(201).json({
      success: true,
      data: trigger
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

// Get triggers
router.get('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      projectId, 
      agentId, 
      type 
    } = req.query as PaginationQuery & { 
      projectId?: string; 
      agentId?: string; 
      type?: TriggerType;
    };
    
    const query: any = { owner: req.user!._id };
    if (projectId) query.projectId = projectId;
    if (agentId) query.agentId = agentId;
    if (type) query.type = type;

    const triggers = await Trigger.find(query)
      .populate('projectId', 'name description')
      .populate('agentId', 'name description')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Trigger.countDocuments(query);

    const response: ApiResponse = {
      success: true,
      data: triggers,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Get trigger by ID
router.get('/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id
    }).populate(['projectId', 'agentId']);

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger not found' }
      });
    }

    const response: ApiResponse = {
      success: true,
      data: trigger
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Update trigger
router.put('/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = UpdateTriggerSchema.parse(req.body);
    
    const trigger = await Trigger.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      validatedData,
      { new: true }
    ).populate(['projectId', 'agentId']);

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger not found' }
      });
    }

    const response: ApiResponse = {
      success: true,
      data: trigger
    };

    return res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation error', details: error.errors }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Delete trigger
router.delete('/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOneAndDelete({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger not found' }
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Trigger deleted successfully' }
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Regenerate API key
router.post('/:id/regenerate-key', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger not found' }
      });
    }

    trigger.apiKey = trigger.generateApiKey();
    await trigger.save();

    const response: ApiResponse = {
      success: true,
      data: { apiKey: trigger.apiKey }
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Toggle trigger status
router.post('/:id/toggle', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger not found' }
      });
    }

    trigger.status = trigger.status === TriggerStatus.ACTIVE ? TriggerStatus.INACTIVE : TriggerStatus.ACTIVE;
    await trigger.save();

    const response: ApiResponse = {
      success: true,
      data: trigger
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Get trigger statistics
router.get('/:id/stats', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger not found' }
      });
    }

    const stats = {
      triggerCount: trigger.triggerCount,
      lastTriggered: trigger.lastTriggeredAt,
      status: trigger.status,
      createdAt: trigger.createdAt
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

export default router;