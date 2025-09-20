# FastAgent

FastAgent 是一个现代化的 AI 智能体平台，基于 Next.js 和 Express.js 构建，提供完整的用户认证、智能体管理和项目协作功能。

## 🚀 技术栈

### 后端
- **Node.js** + **Express.js** - 服务器框架
- **TypeScript** - 类型安全
- **MongoDB** + **Mongoose** - 数据库
- **JWT** - 身份验证
- **Zod** - 数据验证
- **bcryptjs** - 密码加密

### 前端
- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **React Hook Form** + **Zod** - 表单处理
- **Axios** - HTTP 客户端
- **Sonner** - 通知组件

## 📁 项目结构

```
fastagent/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── index.ts        # 入口文件
│   ├── package.json
│   └── .env                # 环境变量
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── app/           # Next.js 应用路由
│   │   ├── components/    # UI 组件
│   │   ├── lib/           # 工具库
│   │   └── types/         # 类型定义
│   ├── package.json
│   └── .env.local         # 环境变量
└── README.md
```

## 🛠️ 开发环境设置

### 前置要求
- Node.js 18+
- MongoDB
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd fastagent
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

3. **配置后端环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接等
   ```

4. **安装前端依赖**
   ```bash
   cd ../frontend
   npm install
   ```

5. **配置前端环境变量**
   ```bash
   cp .env.local.example .env.local
   # 编辑 .env.local 文件
   ```

### 启动开发服务器

1. **启动后端服务**
   ```bash
   cd backend
   npm run dev
   ```
   后端服务将在 http://localhost:5000 启动

2. **启动前端服务**
   ```bash
   cd frontend
   npm run dev
   ```
   前端应用将在 http://localhost:3000 启动

## 🔧 环境变量配置

### 后端 (.env)
```env
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/fastagent

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:3000

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 日志配置
LOG_LEVEL=info
```

### 前端 (.env.local)
```env
# API 配置
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# 应用配置
NEXT_PUBLIC_APP_NAME=FastAgent
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📚 API 文档

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

## 🎨 UI 组件

项目使用 shadcn/ui 组件库，包含以下组件：
- Button - 按钮组件
- Card - 卡片组件
- Input - 输入框组件
- Form - 表单组件
- Label - 标签组件
- Sonner - 通知组件

## 🔒 安全特性

- JWT 身份验证
- 密码加密存储
- CORS 保护
- 速率限制
- 输入验证和清理
- 安全的 HTTP 头设置

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

### Docker 部署

```dockerfile
# 后端 Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
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