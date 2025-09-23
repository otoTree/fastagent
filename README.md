# FastAgent

FastAgent 是一个现代化的 AI 智能体平台，基于 Next.js 和 Express.js 构建，提供完整的用户认证、智能体管理和项目协作功能。

## 🚀 技术栈

### 后端 (Backend)
- **Node.js** + **Express.js** - 服务器框架
- **TypeScript** - 类型安全
- **MongoDB** + **Mongoose** - 数据库
- **JWT** - 身份验证
- **Zod** - 数据验证
- **bcryptjs** - 密码加密
- **Redis** + **ioredis** - 缓存和任务队列
- **Helmet** - 安全中间件
- **CORS** - 跨域处理

### 前端 (Frontend)
- **Next.js 15** - React 框架 (App Router)
- **React 19** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 样式框架
- **shadcn/ui** - UI 组件库
- **React Hook Form** + **Zod** - 表单处理
- **Axios** - HTTP 客户端
- **Sonner** - 通知组件
- **Zustand** - 状态管理
- **Lucide React** - 图标库

### 智能体运行时 (Agent Runtime)
- **Node.js** + **Express.js** - 运行时服务器
- **TypeScript** - 类型安全
- **MongoDB** + **Mongoose** - 数据存储
- **Redis** + **ioredis** - 任务队列
- **Zod** - 数据验证
- **函数式编程** - 编程范式
- **DDD** - 领域驱动设计

## 📁 项目结构

```
fastagent/
├── backend/                 # 后端 API 服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务服务
│   │   ├── utils/          # 工具函数
│   │   ├── types/          # 类型定义
│   │   ├── scripts/        # 脚本文件
│   │   └── index.ts        # 入口文件
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── app/           # Next.js 应用路由
│   │   ├── components/    # UI 组件
│   │   ├── lib/           # 工具库
│   │   ├── services/      # API 服务
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── styles/        # 样式文件
│   │   ├── types/         # 类型定义
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   ├── package.json
│   ├── next.config.ts     # Next.js 配置
│   ├── tailwind.config.ts # Tailwind 配置
│   └── components.json    # shadcn/ui 配置
├── agent-runtime/          # 智能体运行时
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件
│   │   ├── services/      # 业务服务
│   │   ├── types/         # 类型定义
│   │   ├── utils/         # 工具函数
│   │   ├── app.ts         # 应用配置
│   │   └── index.ts       # 入口文件
│   ├── package.json
│   └── tsconfig.json
├── .trae/                  # Trae AI 配置
│   └── rules/
│       └── project_rules.md
├── system-architecture.svg # 系统架构图
└── README.md
```

## 🛠️ 开发环境设置

### 前置要求
- Node.js 18+
- MongoDB
- Redis (可选，用于任务队列)
- npm 或 yarn

### 网络代理配置 (国内用户)
如果在国内网络环境下开发，需要配置代理：
```bash
export https_proxy=http://127.0.0.1:7897 
export http_proxy=http://127.0.0.1:7897 
export all_proxy=socks5://127.0.0.1:7897
```

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/otoTree/fastagent.git
   cd fastagent
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

3. **安装前端依赖**
   ```bash
   cd ../frontend
   npm install
   ```

4. **安装智能体运行时依赖**
   ```bash
   cd ../agent-runtime
   npm install
   ```

### 启动开发服务器

1. **启动后端服务**
   ```bash
   cd backend
   npm run dev
   ```
   后端服务将在 http://localhost:4001 启动

2. **启动前端服务**
   ```bash
   cd frontend
   npm run dev
   ```
   前端应用将在 http://localhost:3004 启动

3. **启动智能体运行时**
   ```bash
   cd agent-runtime
   npm run dev
   ```
   运行时服务将在 http://localhost:3001 启动

## 🔧 环境变量配置

### 后端 (.env)
```env
# 服务器配置
PORT=4001
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/fastagent

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Redis 配置
REDIS_URI=redis://localhost:6379

# CORS 配置
CORS_ORIGIN=http://localhost:3004

# Webhook 配置
WEBHOOK_BASE_URL=http://localhost:4001

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 日志配置
LOG_LEVEL=info
```

### 前端 (.env.local)
```env
# API 配置
NEXT_PUBLIC_API_URL=http://localhost:4001/api
NEXT_PUBLIC_PLUGIN_API_URL=http://localhost:3030

# 应用配置
NEXT_PUBLIC_APP_NAME=FastAgent
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 智能体运行时 (.env)
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/fastagent

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key

# Redis 配置
REDIS_URI=redis://localhost:6379

# 运行时配置
RUNTIME_ID=runtime-001
AGENT_ID=default-agent
AGENT_NAME=Default Agent

# 外部服务配置
PLUGIN_API_URL=http://localhost:3002/api
BACKEND_API_URL=http://localhost:4001/api
```

## 📚 API 文档

### 后端 API (http://localhost:4001/api)

#### 认证相关

##### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

##### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

##### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer <token>
```

##### 用户登出
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### 项目管理
```http
GET /api/projects          # 获取项目列表
POST /api/projects         # 创建项目
GET /api/projects/:id      # 获取项目详情
PUT /api/projects/:id      # 更新项目
DELETE /api/projects/:id   # 删除项目
```

#### 触发器管理
```http
GET /api/triggers          # 获取触发器列表
POST /api/triggers         # 创建触发器
GET /api/triggers/:id      # 获取触发器详情
PUT /api/triggers/:id      # 更新触发器
DELETE /api/triggers/:id   # 删除触发器
```

### 智能体运行时 API (http://localhost:3001/api)

#### 健康检查
```http
GET /api/health           # 服务器健康状态
```

#### 任务管理
```http
GET /api/tasks            # 获取任务列表
POST /api/tasks           # 创建任务
GET /api/tasks/:id        # 获取任务详情
PUT /api/tasks/:id        # 更新任务状态
```

## 🎨 UI 组件

项目使用 shadcn/ui 组件库，包含以下组件：
- **Button** - 按钮组件
- **Card** - 卡片组件
- **Input** - 输入框组件
- **Form** - 表单组件
- **Label** - 标签组件
- **Dialog** - 对话框组件
- **Alert Dialog** - 警告对话框
- **Avatar** - 头像组件
- **Dropdown Menu** - 下拉菜单
- **Navigation Menu** - 导航菜单
- **Radio Group** - 单选按钮组
- **Select** - 选择器组件
- **Slider** - 滑块组件
- **Switch** - 开关组件
- **Tabs** - 标签页组件
- **Sonner** - 通知组件

## 🔒 安全特性

- **JWT 身份验证** - 基于 Token 的用户认证
- **密码加密存储** - bcryptjs 加密
- **CORS 保护** - 跨域请求保护
- **Helmet 安全头** - HTTP 安全头设置
- **输入验证** - Zod 数据验证和清理
- **速率限制** - API 请求频率限制
- **环境变量保护** - 敏感信息环境变量存储

## 🏗️ 架构设计

### 设计原则
- **函数式编程** - 使用箭头函数和纯函数
- **数据模型和逻辑分离** - 清晰的架构分层
- **避免使用 class** - 优先使用函数式组件
- **DDD (领域驱动设计)** - 业务逻辑清晰分离
- **前端组件化** - 可复用的 UI 组件

### 技术特色
- **TypeScript 全栈** - 类型安全的开发体验
- **现代化工具链** - Next.js 15 + Turbopack
- **状态管理** - Zustand 轻量级状态管理
- **样式系统** - Tailwind CSS 4 原子化样式
- **插件系统** - 支持 FastGPT Plugin 扩展

## 🚀 部署

### 生产环境构建

1. **构建后端**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **构建前端**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

3. **构建智能体运行时**
   ```bash
   cd agent-runtime
   npm run build
   npm start
   ```

### Docker 部署

#### 后端 Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4001
CMD ["npm", "start"]
```

#### 前端 Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3004
CMD ["npm", "start"]
```

#### 智能体运行时 Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "4001:4001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/fastagent
      - REDIS_URI=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  agent-runtime:
    build: ./agent-runtime
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/fastagent
      - REDIS_URI=redis://redis:6379
      - BACKEND_API_URL=http://backend:4001/api
    depends_on:
      - mongodb
      - redis
      - backend

  frontend:
    build: ./frontend
    ports:
      - "3004:3004"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4001/api
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 Issue
- 发送邮件至 [your-email@example.com]

---

**FastAgent** - 让 AI 智能体开发变得简单高效 🤖✨