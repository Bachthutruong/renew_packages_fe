import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { BarChart3, Shield } from 'lucide-react';

const PublicLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">資料管理系統</h1>
                <p className="text-sm text-muted-foreground">公開檢視模式</p>
              </div>
            </div>
            <Button onClick={handleAdminLogin} variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">管理員登入</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout; 