import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from '../ui/sidebar';
import { 
  LogOut, 
  BarChart3, 
  Home,
  Database,
  Smartphone,
  UserCog,
  Settings
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: '儀表板', icon: Home, path: '/admin/dashboard' },
    { id: 'data-management', label: '資料管理', icon: Database, path: '/admin/data-management' },
    { id: 'phone-brands', label: '手機品牌', icon: Smartphone, path: '/admin/phone-brands' },
    { id: 'percentage-config', label: '設定比例', icon: UserCog, path: '/admin/percentage-config' },
    { id: 'settings', label: '設定', icon: Settings, path: '/admin/settings' },
  ];

  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    const currentItem = menuItems.find(item => item.path === currentPath);
    return currentItem?.label || '管理面板';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex">
      {/* 管理員側邊欄 */}
      <Sidebar className="hidden lg:flex">
        <SidebarHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">管理面板</h2>
              <p className="text-xs text-muted-foreground">{user?.username}</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <SidebarMenuItem 
                  key={item.id}
                  active={isActive}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      {/* 主要內容 */}
      <div className="flex-1 flex flex-col">
        {/* 標題列 */}
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/60">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="lg:hidden flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <BarChart3 className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-lg font-bold">管理面板</h1>
              </div>
              
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold capitalize">
                  {getCurrentPageTitle()}
                </h1>
              </div>

              <Button variant="outline" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">登出</span>
              </Button>
            </div>
          </div>
        </header>

        {/* 主要內容區域 */}
        <main className="flex-1 px-4 py-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 