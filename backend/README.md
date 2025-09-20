# FastAgent Backend

FastAgent 后端服务，基于 Express.js 和 TypeScript 构建的 RESTful API 服务。

## 🏗️ 架构设计

### 目录结构
```
backend/
├── src/
│   ├── models/           # 数据模型
│   │   └── User.ts      # 用户模型
│   ├── routes/          # API 路由
│   │   ├── auth.ts      # 认证路由
│   │   └── index.ts     # 路由汇总
│   ├── middleware/      # 中间件
│   │   ├── auth.ts      # 身份验证中间件
│   │   ├── error.ts     # 错误处理中间件
│   │   └── validation.ts # 数据验证中间件
│   ├── utils/           # 工具函数
│   │   ├── jwt.ts       # JWT 工具
│   │   └── database.ts  # 数据库连接
│   └── index.ts         # 应用入口
├── package.json
├── tsconfig.json
├── .env                 # 环境变量
└── README.md
```

## 🔧 技术栈

- **Express.js** - Web 框架
- **TypeScript** - 类型安全
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 身份验证
- **bcryptjs** - 密码加密
- **Zod** - 数据验证
- **cors** - 跨域处理
- **helmet** - 安全头
- **express-rate-limit** - 速率限制

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 环境配置
复制环境变量模板并配置：
```bash
cp .env.example .env
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
npm start
```

## 📊 数据模型

### User 模型
```typescript
interface User {
  _id: ObjectId;
  email: string;        // 邮箱（唯一）
  username: string;     // 用户名（唯一）
  password: string;     // 加密密码
  createdAt: Date;      // 创建时间
  updatedAt: Date;      // 更新时间
}
```

## 🛡️ 中间件

### 身份验证中间件
- `authenticate` - 必须登录的路由保护
- `optionalAuth` - 可选登录的路由

### 错误处理中间件
- 统一错误响应格式
- 开发环境显示详细错误信息
- 生产环境隐藏敏感信息

### 数据验证中间件
- 基于 Zod 的请求数据验证
- 自动返回验证错误信息

## 🔐 安全特性

### 密码安全
- bcryptjs 加密存储
- 盐值轮数：12

### JWT 认证
- 访问令牌有效期：7天
- 安全的密钥管理

### 安全头设置
```typescript
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 速率限制
- 15分钟内最多100个请求
- 可配置的限制策略

## 📡 API 端点

### 健康检查
```http
GET /api/health
```

### 认证相关

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "jwt-token"
  },
  "message": "用户注册成功"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### 用户登出
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## 🗄️ 数据库

### MongoDB 连接
```typescript
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

### 索引优化
- email 字段唯一索引
- username 字段唯一索引
- createdAt 字段索引（用于排序）

## 🔧 工具函数

### JWT 工具
```typescript
// 生成 JWT 令牌
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证 JWT 令牌
export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};
```

## 🧪 测试

### 运行测试
```bash
npm test
```

### 测试覆盖率
```bash
npm run test:coverage
```

## 📝 日志

使用内置的 console 进行日志记录：
- 开发环境：详细日志
- 生产环境：错误日志

## 🚀 部署

### 环境变量
确保生产环境配置了所有必要的环境变量：
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your-production-secret
```

### PM2 部署
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔍 监控

### 健康检查端点
```http
GET /api/health
```

### 性能监控
- 响应时间监控
- 错误率统计
- 数据库连接状态

## 🤝 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化

### 提交规范
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试

## 📚 相关文档

- [Express.js 文档](https://expressjs.com/)
- [Mongoose 文档](https://mongoosejs.com/)
- [JWT 文档](https://jwt.io/)
- [Zod 文档](https://zod.dev/)