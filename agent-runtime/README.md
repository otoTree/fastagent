# Agent Runtime

基于 Express + Zod 的 TypeScript 后端项目，采用函数式编程和 DDD 架构设计。

## 特性

- 🚀 Express.js 框架
- 🔍 Zod 数据验证
- 📝 TypeScript 支持
- 🛡️ 安全中间件 (Helmet, CORS)
- 📊 请求日志 (Morgan)
- 🎯 函数式编程风格
- 🏗️ DDD 架构设计
- ⚡ 热重载开发环境

## 项目结构

```
src/
├── config/          # 配置文件
├── middleware/      # 中间件
├── routes/          # 路由定义
├── types/           # 类型定义
├── utils/           # 工具函数
├── models/          # 数据模型
└── index.ts         # 应用入口
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的环境变量。

### 开发模式

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动。

### 构建项目

```bash
npm run build
```

### 生产模式

```bash
npm start
```

## API 端点

### 健康检查

- `GET /api/health` - 服务器健康状态

### 示例用户 API

- `GET /api/example/users` - 获取用户列表
- `POST /api/example/users` - 创建用户
- `GET /api/example/users/:id` - 获取单个用户
- `PUT /api/example/users/:id` - 更新用户
- `DELETE /api/example/users/:id` - 删除用户

## 数据验证

项目使用 Zod 进行数据验证，支持：

- 请求体验证 (`validateBody`)
- 查询参数验证 (`validateQuery`)
- 路径参数验证 (`validateParams`)

## 错误处理

统一的错误处理机制：

- 自定义错误类 `AppError`
- Zod 验证错误自动处理
- 开发环境显示详细错误信息

## 开发规范

- 使用箭头函数
- 函数式编程风格
- 避免使用 class
- 数据模型和逻辑分离
- 组件化设计

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务器端口 | 3001 |
| MONGO_URI | MongoDB 连接字符串 | - |
| JWT_SECRET | JWT 密钥 | - |

## 许可证

ISC