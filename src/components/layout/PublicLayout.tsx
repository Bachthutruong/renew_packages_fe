import React from 'react';
import { Outlet } from 'react-router-dom';
// import { Button } from '../ui/button';
// import { Shield } from 'lucide-react';
import logoImage from '../../assets/logo.png';

const PublicLayout: React.FC = () => {
  // const navigate = useNavigate();

  // const handleAdminLogin = () => {
  //   navigate('/admin/login');
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 !-py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="flex h-28 w-28 items-center justify-center rounded-lg overflow-hidden">
                <img src={logoImage} alt="Logo" className="h-28 w-28 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">續約最划算統計分析</h1>
                {/* <p className="text-sm text-muted-foreground">公開檢視模式</p> */}
              </div>
            </div>
            {/* <Button onClick={handleAdminLogin} variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">管理員登入</span>
            </Button> */}
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