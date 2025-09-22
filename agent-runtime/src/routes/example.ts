import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { ApiResponse } from '../types/common';

const router = Router();

// 示例数据模型
const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(0).max(120),
});

const UserQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

const UserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

type User = z.infer<typeof UserSchema>;
type UserQuery = z.infer<typeof UserQuerySchema>;
type UserParams = z.infer<typeof UserParamsSchema>;

// 模拟数据
let users: (User & { id: string })[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
];

// GET /api/example/users - 获取用户列表
router.get('/', validateQuery(UserQuerySchema), (req: Request, res: Response) => {
  const query = req.query as unknown as UserQuery;
  
  let filteredUsers = users;
  
  if (query.search) {
    filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(query.search!.toLowerCase()) ||
      user.email.toLowerCase().includes(query.search!.toLowerCase())
    );
  }

  const startIndex = (query.page - 1) * query.limit;
  const endIndex = startIndex + query.limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const response: ApiResponse = {
    success: true,
    data: {
      users: paginatedUsers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / query.limit),
      },
    },
  };

  res.json(response);
});

// POST /api/example/users - 创建用户
router.post('/', validateBody(UserSchema), (req: Request, res: Response) => {
  const userData = req.body as User;
  
  const newUser = {
    id: crypto.randomUUID(),
    ...userData,
  };

  users.push(newUser);

  const response: ApiResponse = {
    success: true,
    message: 'User created successfully',
    data: newUser,
  };

  res.status(201).json(response);
});

// GET /api/example/users/:id - 获取单个用户
router.get('/:id', validateParams(UserParamsSchema), (req: Request, res: Response): void => {
  const params = req.params as UserParams;
  
  const user = users.find(u => u.id === params.id);
  
  if (!user) {
    const response: ApiResponse = {
      success: false,
      error: 'User not found',
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: user,
  };

  res.json(response);
});

// PUT /api/example/users/:id - 更新用户
router.put('/:id', 
  validateParams(UserParamsSchema),
  validateBody(UserSchema),
  (req: Request, res: Response): void => {
    const params = req.params as UserParams;
    const userData = req.body as User;
    
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    users[userIndex] = { ...users[userIndex], ...userData };

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: users[userIndex],
    };

    res.json(response);
  }
);

// DELETE /api/example/users/:id - 删除用户
router.delete('/:id', validateParams(UserParamsSchema), (req: Request, res: Response): void => {
  const params = req.params as UserParams;
  
  const userIndex = users.findIndex(u => u.id === params.id);
  
  if (userIndex === -1) {
    const response: ApiResponse = {
      success: false,
      error: 'User not found',
    };
    res.status(404).json(response);
    return;
  }

  users.splice(userIndex, 1);

  const response: ApiResponse = {
    success: true,
    message: 'User deleted successfully',
  };

  res.json(response);
});

export { router as exampleRouter };