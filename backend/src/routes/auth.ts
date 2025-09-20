import { Router, Request, Response, NextFunction } from 'express';
import { User, CreateUserSchema, LoginSchema } from '@/models/User';
import { generateToken } from '@/utils/jwt';
import { createError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validatedData = CreateUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email },
        { username: validatedData.username }
      ]
    });
    
    if (existingUser) {
      throw createError('User with this email or username already exists', 409);
    }
    
    // Create new user
    const user = new User(validatedData);
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validatedData = LoginSchema.parse(req.body);
    
    // Find user by email
    const user = await User.findOne({ email: validatedData.email });
    
    if (!user) {
      throw createError('Invalid email or password', 401);
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(validatedData.password);
    
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;