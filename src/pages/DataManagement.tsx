import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataAPI, phoneBrandsAPI } from '../services/api';
import { PhoneBrand } from '../types';
import { useDataSelection } from '../context/DataSelectionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { 
  Upload, 
  Trash2,
  Database,
  Smartphone,
  Home,
  UserCog,
  Settings,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

const DataManagement: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedB1,
    selectedB2,
    selectedB3,
    b2Data,
    b3Data,
    resetFlow
  } = useDataSelection();
  
  // Data states
  const [b1Values, setB1Values] = useState<string[]>([]);
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  
  // UI states
  const [showImport, setShowImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Load B1 values
      const values = await dataAPI.getB1Values();
      values.sort((a, b) => a.localeCompare(b));
      setB1Values(values);
      
      // Load phone brands
      const brands = await phoneBrandsAPI.getAll();
      setPhoneBrands(brands);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('無法載入資料');
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      await dataAPI.importExcel(file);
      toast.success('匯入成功！');
      loadAllData();
      resetFlow();
    } catch (error: any) {
      console.error('Import error:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('登入期限已過期！請重新登入。');
        navigate('/admin/login');
      } else {
        toast.error(`匯入失敗：${error.response?.data?.error || error.message}`);
      }
    } finally {
      setIsLoading(false);
      setShowImport(false);
    }
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
      
      // Reload data to show natural percentages
      loadAllData();
    } catch (error: any) {
      if (error.message !== 'Cancelled') {
        console.error('Clear configurations failed:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">資料管理</h2>
          <p className="text-muted-foreground">高效地匯入和管理 Excel 資料</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            匯入 Excel
          </Button>
          <Button variant="outline" onClick={clearAllConfigurations} className="gap-2">
            <Trash2 className="h-4 w-4" />
            重設設定
          </Button>
          {/* <Button 
            variant="outline" 
            onClick={async () => {
              try {
                await dataAPI.migratePercentageConfigs();
                toast.success('遷移成功！已修復資料庫結構。');
                loadAllData();
              } catch (error: any) {
                console.error('Migration error:', error);
                toast.error('遷移失敗：' + (error.response?.data?.error || error.message));
              }
            }} 
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            修復結構
          </Button> */}
        </div>
      </div>
      
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{b1Values.length}</div>
                <div className="text-sm text-muted-foreground">B1 數值</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{b2Data.length}</div>
                <div className="text-sm text-muted-foreground">B2 數值</div>
                {selectedB1 && <div className="text-xs text-blue-500">正在檢視：{selectedB1}</div>}
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{b3Data.length}</div>
                <div className="text-sm text-muted-foreground">B3 數值</div>
                {selectedB2 && <div className="text-xs text-blue-500">正在檢視：{selectedB2}</div>}
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{phoneBrands.length}</div>
                <div className="text-sm text-muted-foreground">手機品牌</div>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Smartphone className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            快速操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/dashboard')} 
              className="h-auto p-4 justify-start flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2 w-full">
                <Home className="h-4 w-4" />
                <span className="font-medium">回到儀表板</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                回到檢視和選擇 B1、B2、B3 資料
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/percentage-config')} 
              className="h-auto p-4 justify-start flex-col items-start gap-2"
              disabled={!selectedB1}
            >
              <div className="flex items-center gap-2 w-full">
                <UserCog className="h-4 w-4" />
                <span className="font-medium">設定比例</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {selectedB1 ? '調整百分比' : '請先選擇 B1 才能使用'}
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/phone-brands')} 
              className="h-auto p-4 justify-start flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2 w-full">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">管理手機品牌</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                新增、編輯、刪除手機品牌
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetFlow} 
              className="h-auto p-4 justify-start flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2 w-full">
                <Settings className="h-4 w-4" />
                <span className="font-medium">重設選擇</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                清除所有目前的 B1、B2、B3 選擇
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 目前選擇狀態 */}
      {(selectedB1 || selectedB2 || selectedB3) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">目前選擇狀態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedB1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">B1：</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{selectedB1}</span>
                </div>
              )}
              {selectedB2 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">B2：</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{selectedB2}</span>
                </div>
              )}
              {selectedB3 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">B3：</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{selectedB3}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataManagement; 