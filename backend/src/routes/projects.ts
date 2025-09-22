import express from 'express';
import { authenticate } from '@/middleware/auth';
import { Project, CreateProjectSchema, UpdateProjectSchema } from '@/models/Project';
import { ApiResponse, PaginationQuery } from '@/types';
import { z } from 'zod';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Create project
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = CreateProjectSchema.parse(req.body);
    
    // Check if project name already exists for this user
    const existingProject = await Project.findOne({
      name: validatedData.name,
      owner: req.user!._id
    });
    
    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: { message: 'Project name already exists' }
      });
    }
    
    const project = new Project({
      ...validatedData,
      owner: req.user!._id
    });
    
    await project.save();
    await project.populate('owner', 'username email');
    await project.populate('triggers');
    
    return res.status(201).json({
      success: true,
      data: project
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

// Get projects
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query as PaginationQuery & { search?: string };
    
    const query: any = { owner: req.user!._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'username email')
      .populate('triggers')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(query);

    const response: ApiResponse = {
      success: true,
      data: projects,
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

// Get project by ID
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user!._id
    }).populate('owner', 'username email')
      .populate('triggers');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' }
      });
    }

    return res.json({
      success: true,
      data: project
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Update project
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = UpdateProjectSchema.parse(req.body);
    
    // Check if new name already exists for this user (if name is being changed)
    if (validatedData.name) {
      const existingProject = await Project.findOne({
        name: validatedData.name,
        owner: req.user!._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingProject) {
        return res.status(400).json({
          success: false,
          error: { message: 'Project name already exists' }
        });
      }
    }
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      validatedData,
      { new: true }
    ).populate('owner', 'username email')
     .populate('triggers');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' }
      });
    }

    return res.json({
      success: true,
      data: project
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

// Delete project
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user!._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' }
      });
    }

    return res.json({
      success: true,
      data: { message: 'Project deleted successfully' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get project statistics
router.get('/:id/stats', async (req: express.Request, res: express.Response) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user!._id
    }).populate('triggers');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' }
      });
    }

    const stats = {
      triggerCount: project.triggers.length,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;