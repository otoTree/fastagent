'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/discover', label: '发现' },
    { href: '/plugins', label: '插件市场' },
    { href: '/dashboard', label: '控制台' }
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="border-b bg-white backdrop-blur supports-[backdrop-filter]:bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-slate-900 dark:text-white">
              FastAgent
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-slate-900 dark:hover:text-white',
                    pathname === item.href
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {user.username}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/auth/login">登录</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">注册</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;