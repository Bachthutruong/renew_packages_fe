import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { 
  Upload, 
  LogOut, 
  Settings as SettingsIcon,
  Trash2,
  FileSpreadsheet,
  User,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // UI states
  const [showImport, setShowImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      await dataAPI.importExcel(file);
      toast.success('匯入成功！');
    } catch (error: any) {
      console.error('Import error:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('登入期限已過期！請重新登入。');
        logout();
        navigate('/admin/login');
      } else {
        toast.error(`匯入失敗：${error.response?.data?.error || error.message}`);
      }
    } finally {
      setIsLoading(false);
      setShowImport(false);
    }
  };

  const resetFlow = () => {
    // Navigate to dashboard and reset selections
    navigate('/admin/dashboard');
    toast.success('已重設選擇');
  };

  const clearAllConfigurations = async () => {
    // Use toast.promise for better UX
    const confirmReset = () => {
      return new Promise((resolve, reject) => {
        toast((t) => (
          <div className="flex flex-col gap-3">
            <p className="font-medium">確認刪除設定</p>
            <p className="text-sm text-gray-600">
              您確定要刪除所有百分比設定嗎？ 
              這將重設為自動計算的比例。
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.dismiss(t.id);
                  reject(new Error('Cancelled'));
                }}
              >
                取消
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                刪除
              </Button>
            </div>
          </div>
        ), {
          duration: Infinity,
          position: 'top-center',
        });
      });
    };

    try {
      await confirmReset();
      
      // Proceed with deletion
      await toast.promise(
        dataAPI.clearAllConfigurations(),
        {
          loading: '正在刪除設定...',
          success: '已成功刪除所有設定！',
          error: '刪除設定失敗！'
        }
      );
    } catch (error: any) {
      if (error.message !== 'Cancelled') {
        console.error('Clear configurations failed:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('已成功登出');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">系統設定</h2>
        <p className="text-muted-foreground">設定和管理系統</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            帳戶資訊
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">使用者名稱：</span>
              <span className="font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">角色：</span>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">{user?.role === 'admin' ? '管理員' : '使用者'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">狀態：</span>
              <span className="text-green-600 font-medium">使用中</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            資料管理
          </CardTitle>
          <CardDescription>
            與資料和系統設定相關的操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => setShowImport(true)} 
              className="w-full justify-start gap-2 h-auto py-3"
            >
              <Upload className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">匯入 Excel 資料</div>
                <div className="text-xs text-muted-foreground">上傳 Excel 檔案以更新資料</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetFlow} 
              className="w-full justify-start gap-2 h-auto py-3"
            >
              <SettingsIcon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">重設選擇</div>
                <div className="text-xs text-muted-foreground">清除所有目前的 B1、B2、B3 選擇</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearAllConfigurations} 
              className="w-full justify-start gap-2 h-auto py-3 text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Trash2 className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">刪除所有設定</div>
                <div className="text-xs text-muted-foreground">重設為自動計算的比例</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速導航</CardTitle>
          <CardDescription>
            快速存取其他功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/dashboard')} 
              className="justify-start gap-2 h-auto py-3"
            >
              <SettingsIcon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">儀表板</div>
                <div className="text-xs text-muted-foreground">回到主頁</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/data-management')} 
              className="justify-start gap-2 h-auto py-3"
            >
              <Upload className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">資料管理</div>
                <div className="text-xs text-muted-foreground">匯入和統計</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/phone-brands')} 
              className="justify-start gap-2 h-auto py-3"
            >
              <SettingsIcon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">手機品牌</div>
                <div className="text-xs text-muted-foreground">管理品牌</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/percentage-config')} 
              className="justify-start gap-2 h-auto py-3"
            >
              <SettingsIcon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">設定比例</div>
                <div className="text-xs text-muted-foreground">調整百分比</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">危險區域</CardTitle>
          <CardDescription>
            無法復原的操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleLogout} 
            className="w-full justify-start gap-2 h-auto py-3"
          >
            <LogOut className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">登出</div>
              <div className="text-xs opacity-80">結束工作階段</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* 匯入對話框 */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              從 Excel 匯入資料
            </DialogTitle>
            <DialogDescription>
              選擇 Excel 檔案以匯入資料到系統中
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">
                正在匯入資料...
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              <p>注意：</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>檔案必須為 .xlsx 或 .xls 格式</li>
                <li>欄位順序必須為：B1、B2、B3、詳細資料</li>
                <li>舊資料將被完全取代</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings; 