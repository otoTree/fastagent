import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            FastAgent
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            智能AI代理平台，让人工智能为您的业务赋能
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/plugins">浏览插件</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/auth/login">立即开始</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/register">注册账号</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 快速部署
              </CardTitle>
              <CardDescription>
                一键部署AI代理，快速集成到您的业务流程中
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                支持多种部署方式，包括云端部署和本地部署，满足不同场景需求。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧠 智能对话
              </CardTitle>
              <CardDescription>
                基于先进的大语言模型，提供自然流畅的对话体验
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                支持多轮对话、上下文理解，让AI真正理解您的需求。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔧 灵活配置
              </CardTitle>
              <CardDescription>
                丰富的配置选项，打造专属的AI代理解决方案
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                自定义工作流、插件系统、权限管理，满足企业级应用需求。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
