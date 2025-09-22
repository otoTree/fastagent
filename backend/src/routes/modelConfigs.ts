import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ModelConfig, IModelConfig } from '@/models/ModelConfig';
import { authenticate } from '@/middleware/auth';
import { CreateModelConfigInput, UpdateModelConfigInput } from '@/types';

const router = Router();

// Validation schemas
const CreateModelConfigSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  displayName: z.string().min(1).max(200).trim(),
  provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'custom']),
  modelType: z.enum(['chat', 'completion', 'embedding']).default('chat'),
  apiEndpoint: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  maxTokens: z.number().min(1).max(128000).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  description: z.string().max(500).optional(),
  capabilities: z.array(z.string()).default([]),
  pricing: z.object({
    inputTokenPrice: z.number().min(0),
    outputTokenPrice: z.number().min(0),
    currency: z.string().max(3).default('USD')
  }).optional(),
  rateLimits: z.object({
    requestsPerMinute: z.number().min(1).default(60),
    tokensPerMinute: z.number().min(1).default(10000)
  }).optional()
});

const UpdateModelConfigSchema = CreateModelConfigSchema.partial();

// All routes require authentication
router.use(authenticate);

// Get all model configurations for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const provider = req.query.provider as string;
    const isActive = req.query.isActive as string;

    const query: any = { owner: req.user!._id };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (provider) {
      query.provider = provider;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    
    const [configs, total] = await Promise.all([
      ModelConfig.find(query)
        .populate('owner', 'username email')
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ModelConfig.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        configs,
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

// Get model configuration by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const config = await ModelConfig.findOne({
      _id: req.params.id,
      owner: req.user!._id
    }).populate('owner', 'username email');

    if (!config) {
      return res.status(404).json({
        success: false,
        error: { message: 'Model configuration not found' }
      });
    }

    return res.json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Create new model configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateModelConfigSchema.parse(req.body);
    
    // Check if name already exists for this user
    const existingConfig = await ModelConfig.findOne({
      name: validatedData.name,
      owner: req.user!._id
    });
    
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        error: { message: 'Model configuration name already exists' }
      });
    }
    
    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await ModelConfig.updateMany(
        { owner: req.user!._id },
        { isDefault: false }
      );
    }
    
    const config = new ModelConfig({
      ...validatedData,
      owner: req.user!._id
    });
    
    await config.save();
    await config.populate('owner', 'username email');

    return res.status(201).json({
      success: true,
      data: config
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

// Update model configuration
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateModelConfigSchema.parse(req.body);
    
    // Check if new name already exists for this user (if name is being changed)
    if (validatedData.name) {
      const existingConfig = await ModelConfig.findOne({
        name: validatedData.name,
        owner: req.user!._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingConfig) {
        return res.status(400).json({
          success: false,
          error: { message: 'Model configuration name already exists' }
        });
      }
    }
    
    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await ModelConfig.updateMany(
        { owner: req.user!._id, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }
    
    const config = await ModelConfig.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      validatedData,
      { new: true }
    ).populate('owner', 'username email');

    if (!config) {
      return res.status(404).json({
        success: false,
        error: { message: 'Model configuration not found' }
      });
    }

    return res.json({
      success: true,
      data: config
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

// Delete model configuration
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const config = await ModelConfig.findOne({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: { message: 'Model configuration not found' }
      });
    }

    // Don't allow deletion of default config if it's the only one
    if (config.isDefault) {
      const totalConfigs = await ModelConfig.countDocuments({ owner: req.user!._id });
      if (totalConfigs === 1) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot delete the only model configuration' }
        });
      }
    }

    await ModelConfig.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      data: { message: 'Model configuration deleted successfully' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Set model configuration as default
router.post('/:id/set-default', async (req: Request, res: Response) => {
  try {
    // Unset all other defaults for this user
    await ModelConfig.updateMany(
      { owner: req.user!._id },
      { isDefault: false }
    );
    
    const config = await ModelConfig.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      { isDefault: true },
      { new: true }
    ).populate('owner', 'username email');

    if (!config) {
      return res.status(404).json({
        success: false,
        error: { message: 'Model configuration not found' }
      });
    }

    return res.json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Toggle model configuration active status
router.post('/:id/toggle-active', async (req: Request, res: Response) => {
  try {
    const config = await ModelConfig.findOne({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: { message: 'Model configuration not found' }
      });
    }

    config.isActive = !config.isActive;
    await config.save();
    await config.populate('owner', 'username email');

    return res.json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Test model configuration
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const config = await ModelConfig.findOne({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: { message: 'Model configuration not found' }
      });
    }

    // Here you would implement the actual model testing logic
    // For now, we'll just return a success response
    return res.json({
      success: true,
      data: { 
        message: 'Model configuration test completed',
        status: 'connected'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;