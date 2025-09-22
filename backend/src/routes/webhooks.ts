import express from 'express';
import { authenticate } from '@/middleware/auth';
import { Trigger, CreateTriggerSchema, UpdateTriggerSchema, WebhookConfig } from '@/models/Trigger';
import { WebhookExecutionLog } from '@/models/WebhookExecutionLog';
import { Agent } from '@/models/Agent';
import { ApiResponse, PaginationQuery } from '@/types';
import crypto from 'crypto';
import axios from 'axios';
import { z } from 'zod';

const router = express.Router();

// Generate API key
const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify API key middleware
const verifyApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: { message: 'API key is required' }
      });
    }

    const trigger = await Trigger.findOne({
      apiKey,
      type: 'webhook',
      status: 'active'
    });

    if (!trigger) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid API key' }
      });
    }

    req.webhookTrigger = trigger;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Legacy webhook trigger creation schema for backward compatibility
const CreateWebhookTriggerSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  agentId: z.string().min(1),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
  headers: z.record(z.string()).optional(),
  responseFormat: z.enum(['json', 'text', 'html']).default('json'),
  timeout: z.number().min(1000).max(30000).default(10000),
  retryCount: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(1000).max(60000).default(5000),
  isActive: z.boolean().default(true),
});

// Create webhook trigger (legacy API)
router.post('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = CreateWebhookTriggerSchema.parse(req.body);
    
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

    // Generate API key
    const apiKey = generateApiKey();
    
    // Create webhook config
    const webhookConfig: WebhookConfig = {
      httpMethod: validatedData.httpMethod,
      headers: validatedData.headers || {},
      responseFormat: validatedData.responseFormat,
      timeout: validatedData.timeout,
      retryCount: validatedData.retryCount,
      retryDelay: validatedData.retryDelay
    };
    
    // Create trigger
    const trigger = new Trigger({
      name: validatedData.name,
      description: validatedData.description,
      type: 'webhook',
      projectId: null, // Legacy webhooks might not have projectId
      agentId: validatedData.agentId,
      config: webhookConfig,
      isActive: validatedData.isActive,
      owner: req.user!._id,
      apiKey
    });
    
    await trigger.save();
    
    // Generate webhook URL
    trigger.webhookUrl = trigger.generateWebhookUrl();
    await trigger.save();
    
    await trigger.populate(['agentId', 'owner']);
    
    // Transform to legacy format
    const legacyResponse = {
      _id: trigger._id,
      name: trigger.name,
      description: trigger.description,
      agentId: trigger.agentId,
      webhookUrl: trigger.webhookUrl,
      apiKey: trigger.apiKey,
      isActive: trigger.isActive,
      triggerType: (trigger.config as WebhookConfig).httpMethod,
      httpMethod: (trigger.config as WebhookConfig).httpMethod,
      headers: (trigger.config as WebhookConfig).headers,
      responseFormat: (trigger.config as WebhookConfig).responseFormat,
      timeout: (trigger.config as WebhookConfig).timeout,
      retryCount: (trigger.config as WebhookConfig).retryCount,
      retryDelay: (trigger.config as WebhookConfig).retryDelay,
      lastTriggeredAt: trigger.lastTriggeredAt,
      triggerCount: trigger.triggerCount,
      owner: trigger.owner,
      createdAt: trigger.createdAt,
      updatedAt: trigger.updatedAt
    };
    
    return res.status(201).json({
      success: true,
      data: legacyResponse
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

// Get webhook triggers (legacy API)
router.get('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { page = 1, limit = 10, search, agentId } = req.query as PaginationQuery & {
      search?: string;
      agentId?: string;
    };

    const query: any = { 
      owner: req.user!._id,
      type: 'webhook'
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (agentId) {
      query.agentId = agentId;
    }

    const triggers = await Trigger.find(query)
      .populate(['agentId', 'owner'])
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Trigger.countDocuments(query);

    // Transform to legacy format
    const legacyTriggers = triggers.map(trigger => ({
      _id: trigger._id,
      name: trigger.name,
      description: trigger.description,
      agentId: trigger.agentId,
      webhookUrl: trigger.webhookUrl,
      apiKey: trigger.apiKey,
      isActive: trigger.isActive,
      triggerType: (trigger.config as WebhookConfig).httpMethod,
      httpMethod: (trigger.config as WebhookConfig).httpMethod,
      headers: (trigger.config as WebhookConfig).headers,
      responseFormat: (trigger.config as WebhookConfig).responseFormat,
      timeout: (trigger.config as WebhookConfig).timeout,
      retryCount: (trigger.config as WebhookConfig).retryCount,
      retryDelay: (trigger.config as WebhookConfig).retryDelay,
      lastTriggeredAt: trigger.lastTriggeredAt,
      triggerCount: trigger.triggerCount,
      owner: trigger.owner,
      createdAt: trigger.createdAt,
      updatedAt: trigger.updatedAt
    }));

    res.json({
      success: true,
      data: legacyTriggers,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get single webhook trigger (legacy API)
router.get('/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      type: 'webhook'
    }).populate(['agentId', 'owner']);

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Webhook trigger not found' }
      });
    }

    // Transform to legacy format
    const legacyResponse = {
      _id: trigger._id,
      name: trigger.name,
      description: trigger.description,
      agentId: trigger.agentId,
      webhookUrl: trigger.webhookUrl,
      apiKey: trigger.apiKey,
      isActive: trigger.isActive,
      triggerType: (trigger.config as WebhookConfig).httpMethod,
      httpMethod: (trigger.config as WebhookConfig).httpMethod,
      headers: (trigger.config as WebhookConfig).headers,
      responseFormat: (trigger.config as WebhookConfig).responseFormat,
      timeout: (trigger.config as WebhookConfig).timeout,
      retryCount: (trigger.config as WebhookConfig).retryCount,
      retryDelay: (trigger.config as WebhookConfig).retryDelay,
      lastTriggeredAt: trigger.lastTriggeredAt,
      triggerCount: trigger.triggerCount,
      owner: trigger.owner,
      createdAt: trigger.createdAt,
      updatedAt: trigger.updatedAt
    };

    return res.json({
      success: true,
      data: legacyResponse
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Update webhook trigger (legacy API)
router.put('/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = CreateWebhookTriggerSchema.partial().parse(req.body);
    
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      type: 'webhook'
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Webhook trigger not found' }
      });
    }

    // Update basic fields
    if (validatedData.name) trigger.name = validatedData.name;
    if (validatedData.description !== undefined) trigger.description = validatedData.description;
    if (validatedData.isActive !== undefined) trigger.isActive = validatedData.isActive;

    // Update webhook config
    const currentConfig = trigger.config as WebhookConfig;
    const updatedConfig: WebhookConfig = {
      httpMethod: validatedData.httpMethod || currentConfig.httpMethod,
      headers: validatedData.headers || currentConfig.headers,
      responseFormat: validatedData.responseFormat || currentConfig.responseFormat,
      timeout: validatedData.timeout || currentConfig.timeout,
      retryCount: validatedData.retryCount || currentConfig.retryCount,
      retryDelay: validatedData.retryDelay || currentConfig.retryDelay
    };
    
    trigger.config = updatedConfig;
    await trigger.save();
    await trigger.populate(['agentId', 'owner']);

    // Transform to legacy format
    const legacyResponse = {
      _id: trigger._id,
      name: trigger.name,
      description: trigger.description,
      agentId: trigger.agentId,
      webhookUrl: trigger.webhookUrl,
      apiKey: trigger.apiKey,
      isActive: trigger.isActive,
      triggerType: (trigger.config as WebhookConfig).httpMethod,
      httpMethod: (trigger.config as WebhookConfig).httpMethod,
      headers: (trigger.config as WebhookConfig).headers,
      responseFormat: (trigger.config as WebhookConfig).responseFormat,
      timeout: (trigger.config as WebhookConfig).timeout,
      retryCount: (trigger.config as WebhookConfig).retryCount,
      retryDelay: (trigger.config as WebhookConfig).retryDelay,
      lastTriggeredAt: trigger.lastTriggeredAt,
      triggerCount: trigger.triggerCount,
      owner: trigger.owner,
      createdAt: trigger.createdAt,
      updatedAt: trigger.updatedAt
    };

    return res.json({
      success: true,
      data: legacyResponse
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

// Delete webhook trigger (legacy API)
router.delete('/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOneAndDelete({
      _id: req.params.id,
      owner: req.user!._id,
      type: 'webhook'
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Webhook trigger not found' }
      });
    }

    return res.json({
      success: true,
      message: 'Webhook trigger deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Regenerate API key (legacy API)
router.post('/:id/regenerate-key', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      type: 'webhook'
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Webhook trigger not found' }
      });
    }

    trigger.apiKey = trigger.generateApiKey();
    await trigger.save();

    return res.json({
      success: true,
      data: { apiKey: trigger.apiKey }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Webhook trigger endpoint
router.all('/trigger/:id', verifyApiKey, async (req, res) => {
  try {
    const trigger = req.webhookTrigger!;
    const startTime = Date.now();
    
    // Increment trigger count
    await trigger.incrementTriggerCount();
    await trigger.updateLastTriggered();

    // Get agent
    const agent = await Agent.findById(trigger.agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Associated agent not found' }
      });
    }

    // Process the webhook request
    const requestData = {
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      params: req.params
    };

    // Here you would integrate with your agent execution logic
    // For now, we'll return a mock response
    const responseData = {
      message: 'Webhook processed successfully',
      agent: agent.name,
      timestamp: new Date().toISOString(),
      requestMethod: req.method
    };

    const executionTime = Date.now() - startTime;

    // Log the execution
    const log = new WebhookExecutionLog({
      triggerId: trigger._id,
      agentId: trigger.agentId,
      requestData,
      responseData,
      statusCode: 200,
      executionTime,
      success: true
    });
    await log.save();

    const config = trigger.config as WebhookConfig;
    
    // Return response based on format
    switch (config.responseFormat) {
      case 'json':
        return res.json(responseData);
      case 'text':
        return res.send(JSON.stringify(responseData));
      case 'html':
        return res.send(`<html><body><pre>${JSON.stringify(responseData, null, 2)}</pre></body></html>`);
      default:
        return res.json(responseData);
    }
  } catch (error) {
    const executionTime = Date.now() - Date.now();
    
    // Log the error
    const log = new WebhookExecutionLog({
      triggerId: req.webhookTrigger!._id,
      agentId: req.webhookTrigger!.agentId,
      requestData: {
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body
      },
      responseData: { error: 'Internal server error' },
      statusCode: 500,
      executionTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    await log.save();

    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get webhook logs (legacy API)
router.get('/:id/logs', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { page = 1, limit = 10 } = req.query as PaginationQuery;
    
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      type: 'webhook'
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Webhook trigger not found' }
      });
    }

    const logs = await WebhookExecutionLog.find({ triggerId: trigger._id })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await WebhookExecutionLog.countDocuments({ triggerId: trigger._id });

    return res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Manual trigger (legacy API)
router.post('/:id/trigger', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await Trigger.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      type: 'webhook'
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Webhook trigger not found' }
      });
    }

    // Simulate webhook execution
    const responseData = {
      message: 'Manual trigger executed successfully',
      timestamp: new Date().toISOString(),
      data: req.body || {}
    };

    await trigger.incrementTriggerCount();
    await trigger.updateLastTriggered();

    return res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

declare global {
  namespace Express {
    interface Request {
      webhookTrigger?: any;
    }
  }
}

export default router;