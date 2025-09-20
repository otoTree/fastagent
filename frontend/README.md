# FastAgent Frontend

FastAgent 前端应用，基于 Next.js 15 和 TypeScript 构建的现代化 React 应用。

## 🏗️ 架构设计

### 目录结构
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # 认证相关页面
│   │   │   ├── login/         # 登录页面
│   │   │   └── register/      # 注册页面
│   │   ├── dashboard/         # 仪表板页面
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # UI 组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── lib/                  # 工具库
│   │   ├── api.ts            # API 客户端
│   │   ├── auth.ts           # 认证工具
│   │   └── utils.ts          # 通用工具
│   └── types/                # 类型定义
│       └── index.ts          # 类型声明
├── public/                   # 静态资源
├── package.json
├── tailwind.config.ts        # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
├── next.config.ts           # Next.js 配置
├── .env.local               # 环境变量
└── README.md
```

## 🔧 技术栈

- **Next.js 15** - React 框架（App Router）
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS 框架
- **shadcn/ui** - 高质量 UI 组件库
- **React Hook Form** - 表单处理
- **Zod** - 数据验证
- **Axios** - HTTP 客户端
- **Sonner** - 通知组件
- **Lucide React** - 图标库

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 环境配置
复制环境变量模板并配置：
```bash
cp .env.local.example .env.local
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

## 🎨 UI 组件系统

### shadcn/ui 组件
项目使用 shadcn/ui 组件库，包含以下组件：

- **Button** - 按钮组件
- **Card** - 卡片组件
- **Input** - 输入框组件
- **Form** - 表单组件
- **Label** - 标签组件

### 组件使用示例
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>示例卡片</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>点击按钮</Button>
      </CardContent>
    </Card>
  );
}
```

## 🔐 认证系统

### 认证流程
1. 用户注册/登录
2. 服务器返回 JWT 令牌
3. 前端存储令牌到 localStorage
4. 后续请求自动携带令牌

### 认证工具函数
```typescript
// 登录
const response = await authApi.login({
  email: "user@example.com",
  password: "password123"
});

// 获取当前用户
const user = await authApi.getCurrentUser();

// 登出
await authApi.logout();
```

### 令牌管理
```typescript
// 存储令牌
tokenStorage.set(token);

// 获取令牌
const token = tokenStorage.get();

// 删除令牌
tokenStorage.remove();
```

## 📱 页面结构

### 首页 (/)
- 欢迎界面
- 功能介绍
- 导航链接

### 登录页面 (/auth/login)
- 邮箱/密码登录
- 表单验证
- 错误处理

### 注册页面 (/auth/register)
- 用户注册表单
- 密码确认
- 实时验证

### 仪表板 (/dashboard)
- 用户信息展示
- 功能统计卡片
- 快速操作入口

## 🛠️ 表单处理

### React Hook Form + Zod
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
});

export default function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    // 处理表单提交
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* 表单字段 */}
      </form>
    </Form>
  );
}
```

## 🌐 API 集成

### API 客户端配置
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

## 🎯 类型定义

### API 响应类型
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  _id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
```

### 表单类型
```typescript
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}
```

## 🎨 样式系统

### Tailwind CSS 配置
```typescript
// tailwind.config.ts
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... 更多颜色定义
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### CSS 变量
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  /* ... 更多变量 */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... 暗色主题变量 */
}
```

## 🔔 通知系统

### Sonner 通知
```tsx
import { toast } from "sonner";

// 成功通知
toast.success("操作成功！");

// 错误通知
toast.error("操作失败，请重试");

// 信息通知
toast.info("这是一条信息");

// 警告通知
toast.warning("请注意");
```

## 🚀 性能优化

### Next.js 优化
- 自动代码分割
- 图片优化
- 字体优化
- 静态生成 (SSG)
- 服务端渲染 (SSR)

### 组件优化
```tsx
import { memo, useMemo, useCallback } from 'react';

const OptimizedComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }));
  }, [data]);

  const handleClick = useCallback(() => {
    // 处理点击事件
  }, []);

  return (
    <div onClick={handleClick}>
      {processedData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});
```

## 🧪 测试

### 单元测试
```bash
npm run test
```

### E2E 测试
```bash
npm run test:e2e
```

### 测试覆盖率
```bash
npm run test:coverage
```

## 📱 响应式设计

### 断点系统
```css
/* Tailwind 断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
2xl: 1536px /* 2K 屏幕 */
```

### 响应式组件
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 移动端 1 列，平板 2 列，桌面 3 列 */}
</div>
```

## 🚀 部署

### Vercel 部署
```bash
npm install -g vercel
vercel
```

### 自定义服务器部署
```bash
npm run build
npm start
```

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 开发工具

### VS Code 扩展推荐
- TypeScript Importer
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Prettier - Code formatter

### 代码规范
- ESLint 配置
- Prettier 格式化
- TypeScript 严格模式
- Git hooks (husky)

## 📚 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [React Hook Form 文档](https://react-hook-form.com/)
- [Zod 文档](https://zod.dev/)
