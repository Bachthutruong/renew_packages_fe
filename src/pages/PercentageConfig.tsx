import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataAPI } from '../services/api';
import { apiCache } from '../services/api';
import { DataWithPercentage, GroupedB3Detail } from '../types';
import { useDataSelection } from '../context/DataSelectionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Home,
  ArrowLeft,
  Settings,
  ChevronDown,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const PercentageConfig: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedB1,
    selectedB2,
    selectedB3,
    b2Data,
    b3Data,
    setB2Data,
    setB3Data,
    resetFlow,
    setSelectedB2,
    setSelectedB3
  } = useDataSelection();
  
  // Original server data for comparison
  const [originalB2Data, setOriginalB2Data] = useState<DataWithPercentage[]>([]);
  const [originalB3Data, setOriginalB3Data] = useState<DataWithPercentage[]>([]);
  
  // Local percentage states for better UX
  const [localB2Data, setLocalB2Data] = useState<DataWithPercentage[]>([]);
  const [localB3Data, setLocalB3Data] = useState<DataWithPercentage[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  
  // B3 Detail states
  const [b3Details, setB3Details] = useState<GroupedB3Detail[]>([]);
  const [localB3Details, setLocalB3Details] = useState<GroupedB3Detail[]>([]);
  const [hasB3DetailChanges, setHasB3DetailChanges] = useState(false);
  const [isLoadingB3Details, setIsLoadingB3Details] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);

  // Add state for input values to handle controlled inputs properly
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});

  // Collapse/Expand states
  const [isB2Expanded, setIsB2Expanded] = useState(true);
  const [isB3Expanded, setIsB3Expanded] = useState(true);

  useEffect(() => {
    // Initialize input values when data changes
    const newInputValues: {[key: string]: string} = {};
    
    // Initialize B2 input values
    const b2DataToUse = localB2Data.length > 0 ? localB2Data : b2Data;
    b2DataToUse.forEach(item => {
      newInputValues[`b2-${item.value}`] = item.percentage.toString();
    });
    
    // Initialize B3 input values
    const b3DataToUse = localB3Data.length > 0 ? localB3Data : b3Data;
    b3DataToUse.forEach(item => {
      newInputValues[`b3-${item.value}`] = item.percentage.toString();
    });
    
    setInputValues(newInputValues);
  }, [b2Data, b3Data, localB2Data, localB3Data]);

  useEffect(() => {
    // Load initial data when we have selections
    if (selectedB1) {
      console.log('[PercentageConfig] Loading B2 data for B1:', selectedB1);
      loadB2Data(selectedB1);
    }
    if (selectedB1 && selectedB2) {
      console.log('[PercentageConfig] Loading B3 data for B1:', selectedB1, 'B2:', selectedB2);
      loadB3Data(selectedB1, selectedB2);
    } else if (selectedB1 && !selectedB2) {
      console.log('[PercentageConfig] B1 selected but no B2 - clearing B3 data');
      setB3Data([]);
      setLocalB3Data([]);
      setOriginalB3Data([]);
    }
  }, [selectedB1, selectedB2]);

  const loadB2Data = async (b1Value: string) => {
    try {
      console.log(`[loadB2Data] Loading B2 data for B1: ${b1Value}`);
      const data = await dataAPI.getB2Data(b1Value);
      console.log(`[loadB2Data] Server returned:`, data);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      
      // Save original server data
      setOriginalB2Data([...sortedData]);
      setB2Data(sortedData);
      
      // Only initialize local state if not already set or no local changes
      if (localB2Data.length === 0 || !hasLocalChanges) {
        console.log('[loadB2Data] Initializing localB2Data from server data');
        setLocalB2Data(sortedData);
      } else {
        console.log('[loadB2Data] Keeping existing localB2Data (has unsaved changes)');
        console.log('[loadB2Data] Current localB2Data:', localB2Data);
      }
    } catch (error: any) {
      console.error('Failed to load B2 data:', error);
      toast.error('無法載入 B2 資料');
    }
  };

  const loadB3Data = async (b1Value: string, b2Value: string) => {
    try {
      console.log(`[loadB3Data] Loading B3 data for B1: ${b1Value}, B2: ${b2Value}`);
      const data = await dataAPI.getB3Data(b1Value, b2Value);
      console.log(`[loadB3Data] Server returned:`, data);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      
      // Save original server data
      setOriginalB3Data([...sortedData]);
      setB3Data(sortedData);
      
      // Only initialize local state if not already set or no local changes
      if (localB3Data.length === 0 || !hasLocalChanges) {
        console.log('[loadB3Data] Initializing localB3Data from server data');
        setLocalB3Data(sortedData);
      } else {
        console.log('[loadB3Data] Keeping existing localB3Data (has unsaved changes)');
        console.log('[loadB3Data] Current localB3Data:', localB3Data);
      }
    } catch (error: any) {
      console.error('Failed to load B3 data:', error);
      toast.error('無法載入 B3 資料');
    }
  };

  // Load B3 details for a specific B3 value
  const loadB3Details = async (b3Value: string) => {
    if (!selectedB1 || !selectedB2 || !b3Value) return;
    
    setIsLoadingB3Details(true);
    try {
      console.log('[PercentageConfig] Loading B3 details for:', { selectedB1, selectedB2, b3Value });
      const details = await dataAPI.getB3Details(selectedB1, selectedB2, b3Value);
      console.log('[PercentageConfig] Received B3 details:', details);
      
      // Validate and set details
      if (Array.isArray(details) && details.length > 0) {
        const validatedDetails = details.filter(item => 
          item && typeof item === 'object' && 
          item.detail && typeof item.detail === 'string' &&
          typeof item.count === 'number' &&
          typeof item.totalCount === 'number' &&
          typeof item.percentage === 'number'
        );
        
        console.log('[PercentageConfig] Validated details count:', validatedDetails.length);
        setB3Details(validatedDetails);
        
        // Initialize local state with server data
        setLocalB3Details(validatedDetails.map(item => ({
          ...item,
          configuredPercentage: item.configuredPercentage || item.percentage
        })));
        setHasB3DetailChanges(false);
      } else {
        console.log('[PercentageConfig] No valid details found');
        setB3Details([]);
        setLocalB3Details([]);
        setHasB3DetailChanges(false);
      }
    } catch (error: any) {
      console.error('Failed to load B3 details:', error);
      toast.error('載入 B3 詳細資料失敗');
      setB3Details([]);
      setLocalB3Details([]);
      setHasB3DetailChanges(false);
    } finally {
      setIsLoadingB3Details(false);
    }
  };

  // Enhanced free input logic - no auto-balance
  const updateLocalPercentage = (type: 'B2' | 'B3', value: string, newPercentage: number) => {
    console.log(`[updateLocalPercentage] Updating ${type} percentage:`, { value, newPercentage });
    
    if (type === 'B2') {
      setLocalB2Data(prev => prev.map(item => 
        item.value === value 
          ? { ...item, percentage: newPercentage }
          : item
      ));
    } else if (type === 'B3') {
      setLocalB3Data(prev => prev.map(item => 
        item.value === value 
          ? { ...item, percentage: newPercentage }
          : item
      ));
    }
    
    setHasLocalChanges(true);
  };

  // Update B3 detail percentage locally
  const updateLocalB3DetailPercentage = (detail: string, percentage: number) => {
    console.log('[updateLocalB3DetailPercentage] Updating:', { detail, percentage });
    
    setLocalB3Details(prev => prev.map(item => 
      item.detail === detail 
        ? { ...item, configuredPercentage: percentage }
        : item
    ));
    setHasB3DetailChanges(true);
  };

  // Save B3 detail changes
  const saveB3DetailChanges = async () => {
    if (!hasB3DetailChanges || !selectedB1 || !selectedB2 || !selectedB3) return;
    
    console.log('[saveB3DetailChanges] Starting save process...');
    console.log('[saveB3DetailChanges] localB3Details:', localB3Details);
    
    try {
      setIsLoading(true);
      
      // Clear frontend cache first
      apiCache.clearByPrefix('b3Details');
      
      // Save all changed details
      for (const item of localB3Details) {
        if (item.configuredPercentage !== undefined) {
          try {
            console.log(`🔄 Saving B3 detail ${item.detail}: ${item.configuredPercentage}%`);
            await dataAPI.updateB3DetailPercentage(selectedB1, selectedB2, selectedB3, item.detail, item.configuredPercentage);
            console.log(`✅ B3 detail ${item.detail} saved`);
          } catch (error: any) {
            console.error(`❌ Failed to save B3 detail ${item.detail}:`, error);
            throw new Error(`Failed to save B3 detail ${item.detail}: ${error.message || error}`);
          }
        }
      }
      
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload from server to get updated data
      console.log('[saveB3DetailChanges] Reloading B3 details from server...');
      await loadB3Details(selectedB3);
      
      setHasB3DetailChanges(false);
      console.log('🎉 B3 detail save completed successfully!');
      toast.success('B3 詳細資料儲存成功！');
      
    } catch (error: any) {
      console.error('❌ B3 detail save failed:', error);
      
      let errorMessage = '儲存 B3 詳細資料失敗！';
      if (error.message) {
        errorMessage += `\n\n詳細錯誤：${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset B3 detail changes
  const resetB3DetailChanges = () => {
    console.log('Resetting B3 detail changes to server data...');
    setLocalB3Details(b3Details.map(item => ({
      ...item,
      configuredPercentage: item.configuredPercentage || item.percentage
    })));
    setHasB3DetailChanges(false);
  };

  // Reset B3 details to natural percentages
  const resetB3DetailsToNatural = () => {
    console.log('Resetting B3 details to natural percentages...');
    setLocalB3Details(b3Details.map(item => ({
      ...item,
      configuredPercentage: undefined
    })));
    setHasB3DetailChanges(true);
  };

  const saveLocalChanges = async () => {
    if (!hasLocalChanges) return;
    
    // Validate B2 total
    if (localB2Data.length > 0) {
      const b2Total = localB2Data.reduce((sum, item) => sum + item.percentage, 0);
      if (b2Total !== 100) {
        toast.error(`B2 總百分比為 ${b2Total}%，必須等於 100% 才能儲存！`);
        return;
      }
    }
    
    // Validate B3 total
    if (localB3Data.length > 0) {
      const b3Total = localB3Data.reduce((sum, item) => sum + item.percentage, 0);
      if (b3Total !== 100) {
        toast.error(`B3 總百分比為 ${b3Total}%，必須等於 100% 才能儲存！`);
        return;
      }
    }
    
    console.log(`[saveLocalChanges] Starting save process...`);
    console.log(`[saveLocalChanges] localB2Data:`, localB2Data);
    console.log(`[saveLocalChanges] originalB2Data:`, originalB2Data);
    console.log(`[saveLocalChanges] localB3Data:`, localB3Data);
    console.log(`[saveLocalChanges] originalB3Data:`, originalB3Data);
    
    try {
      setIsLoading(true);
      
      // Force save ALL local B2 data (don't compare with synced b2Data)
      for (const item of localB2Data) {
        try {
          console.log(`🔄 Force saving B2 ${item.value}: ${item.percentage}% for B1: ${selectedB1}`);
          await dataAPI.updateB2Percentage(selectedB1, item.value, item.percentage);
          console.log(`✅ B2 ${item.value} force saved for B1: ${selectedB1}`);
        } catch (error: any) {
          console.error(`❌ Failed to save B2 ${item.value}:`, error);
          throw new Error(`Failed to save B2 ${item.value}: ${error.message || error}`);
        }
      }
      
      // Force save ALL local B3 data
      for (const item of localB3Data) {
        try {
          console.log(`🔄 Force saving B3 ${item.value}: ${item.percentage}% for B1: ${selectedB1}, B2: ${selectedB2}`);
          await dataAPI.updateB3Percentage(selectedB1, selectedB2, item.value, item.percentage);
          console.log(`✅ B3 ${item.value} force saved for B1: ${selectedB1}, B2: ${selectedB2}`);
        } catch (error: any) {
          console.error(`❌ Failed to save B3 ${item.value}:`, error);
          throw new Error(`Failed to save B3 ${item.value}: ${error.message || error}`);
        }
      }
      
      console.log('🔄 All data force saved to server. Now reloading...');
      
      // Force reload from server to verify persistence
      if (selectedB1) {
        try {
          console.log('🔄 Reloading B2 data from server...');
          const freshB2Data = await dataAPI.getB2Data(selectedB1);
          console.log('✅ Fresh B2 data from server:', freshB2Data);
          
          // Update all states with fresh server data
          setOriginalB2Data([...freshB2Data]);
          setB2Data([...freshB2Data]);
          setLocalB2Data([...freshB2Data]);
        } catch (error: any) {
          console.error('❌ Failed to reload B2 data:', error);
          throw new Error(`Failed to reload B2 data: ${error.message || error}`);
        }
      }
      
      if (selectedB1 && selectedB2) {
        try {
          console.log('🔄 Reloading B3 data from server...');
          const freshB3Data = await dataAPI.getB3Data(selectedB1, selectedB2);
          console.log('✅ Fresh B3 data from server:', freshB3Data);
          
          // Update all states with fresh server data
          setOriginalB3Data([...freshB3Data]);
          setB3Data([...freshB3Data]);
          setLocalB3Data([...freshB3Data]);
        } catch (error: any) {
          console.error('❌ Failed to reload B3 data:', error);
          throw new Error(`Failed to reload B3 data: ${error.message || error}`);
        }
      }
      
      setHasLocalChanges(false);
      console.log('🎉 Save and reload completed successfully!');
      toast.success('儲存成功！資料已更新。');
      
    } catch (error: any) {
      console.error('❌ Save process failed:', error);
      
      // Show detailed error message
      let errorMessage = '儲存變更失敗！';
      if (error.message) {
        errorMessage += `\n\n詳細錯誤：${error.message}`;
      }
      
      // Check for common error types
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        errorMessage += '\n\n🔧 很可能後端伺服器尚未執行。請檢查。';
      } else if (error.response?.status === 500) {
        errorMessage += '\n\n🔧 後端伺服器錯誤。檢查資料庫連線。';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage += '\n\n🔧 權限錯誤。請重新登入。';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetLocalChanges = () => {
    console.log('Resetting local changes to server data...');
    setLocalB2Data([...b2Data]);
    setLocalB3Data([...b3Data]);
    setHasLocalChanges(false);
  };

  const forceRefreshLocalData = async () => {
    console.log('Force refreshing local data...');
    setIsLoading(true);
    
    try {
      // Clear local state first
      setLocalB2Data([]);
      setLocalB3Data([]);
      setHasLocalChanges(false);
      
      // Reload from server
      if (selectedB1) {
        console.log('Reloading B2 data from server...');
        await loadB2Data(selectedB1);
      }
      
      if (selectedB1 && selectedB2) {
        console.log('Reloading B3 data from server...');
        await loadB3Data(selectedB1, selectedB2);
      }
      
      console.log('Force refresh completed!');
      toast.success('資料已重新整理！');
    } catch (error: any) {
      console.error('Force refresh failed:', error);
      toast.error('重新整理資料失敗！');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseB1 = () => {
    // Reset selections to choose new B1
    resetFlow();
    setLocalB2Data([]);
    setLocalB3Data([]);
    setHasLocalChanges(false);
    navigate('/admin/dashboard');
  };

  const resetToEvenDistribution = (type: 'B2' | 'B3') => {
    if (type === 'B2') {
      const currentData = localB2Data.length > 0 ? localB2Data : b2Data;
      if (currentData.length === 0) return;
      
      const evenPercentage = Math.floor(100 / currentData.length);
      const remainder = 100 % currentData.length;
      
      const updatedData = currentData.map((item, index) => ({
        ...item,
        percentage: evenPercentage + (index < remainder ? 1 : 0)
      }));
      
      // Update input values as well
      const newInputValues: {[key: string]: string} = {};
      updatedData.forEach(item => {
        newInputValues[`b2-${item.value}`] = item.percentage.toString();
      });
      setInputValues(prev => ({ ...prev, ...newInputValues }));
      
      console.log('[B2] Reset to even distribution:', updatedData.map(item => `${item.value}: ${item.percentage}%`));
      setLocalB2Data(updatedData);
      setHasLocalChanges(true);
    } else {
      const currentData = localB3Data.length > 0 ? localB3Data : b3Data;
      if (currentData.length === 0) return;
      
      const evenPercentage = Math.floor(100 / currentData.length);
      const remainder = 100 % currentData.length;
      
      const updatedData = currentData.map((item, index) => ({
        ...item,
        percentage: evenPercentage + (index < remainder ? 1 : 0)
      }));
      
      // Update input values as well
      const newInputValues: {[key: string]: string} = {};
      updatedData.forEach(item => {
        newInputValues[`b3-${item.value}`] = item.percentage.toString();
      });
      setInputValues(prev => ({ ...prev, ...newInputValues }));
      
      console.log('[B3] Reset to even distribution:', updatedData.map(item => `${item.value}: ${item.percentage}%`));
      setLocalB3Data(updatedData);
      setHasLocalChanges(true);
    }
  };

  // Force reload B3 details from server
  const forceReloadB3Details = async () => {
    if (!selectedB1 || !selectedB2 || !selectedB3) return;
    
    console.log('[forceReloadB3Details] Force reloading B3 details...');
    
    try {
      // Clear all cache
      apiCache.clearByPrefix('b3Details');
      
      // Reload from server
      await loadB3Details(selectedB3);
      
      toast.success('B3 詳細資料已重新載入！');
    } catch (error: any) {
      console.error('[forceReloadB3Details] Failed to reload:', error);
      toast.error('重新載入失敗');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">設定百分比</h2>
          <p className="text-muted-foreground">
            調整數值的百分比。變更將暫時儲存，您可以確認或取消。
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              const allExpanded = isB2Expanded && isB3Expanded;
              setIsB2Expanded(!allExpanded);
              setIsB3Expanded(!allExpanded);
            }}
            className="gap-2"
            title={isB2Expanded && isB3Expanded ? '收合所有區段' : '展開所有區段'}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${
              isB2Expanded && isB3Expanded ? 'rotate-0' : 'rotate-180'
            }`} />
            {isB2Expanded && isB3Expanded ? '收合全部' : '展開全部'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/dashboard')} 
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            回到儀表板
          </Button>
          <Button 
            variant="outline" 
            onClick={handleChooseB1} 
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            選擇其他 B1
          </Button>
        </div>
      </div>

      {/* Current Selection Status */}
      <Card>
        <CardHeader>
          <CardTitle>目前設定</CardTitle>
          <CardDescription>
            調整數據的百分比，變更將自動平衡總和至 100%。您可以儲存或取消變更。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">目前選擇：</span>
              </div>
              
              {selectedB1 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">B1：</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{selectedB1}</span>
                </div>
              )}
              
              {selectedB2 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">B2：</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{selectedB2}</span>
                </div>
              )}

              {!selectedB1 && (
                <div className="text-sm text-muted-foreground">請先在儀表板選擇 B1</div>
              )}
              
              {selectedB1 && !selectedB2 && (
                <div className="text-sm text-muted-foreground">請在儀表板續約選手機案比較划算，您要手機案嗎？ 以編輯 B3 百分比</div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">資料狀態：</span>
              </div>
              
              <div className="text-xs space-y-1">
                <div>B2 資料：{b2Data.length} 項目</div>
                <div>B3 資料：{b3Data.length} 項目</div>
                {hasLocalChanges && (
                  <div className="text-amber-600">有未儲存的變更</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 儲存/重設面板 */}
      {hasLocalChanges && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium">有未儲存的變更</span>
                {(() => {
                  const b2Total = localB2Data.length > 0 ? localB2Data.reduce((sum, item) => sum + item.percentage, 0) : 100;
                  const b3Total = localB3Data.length > 0 ? localB3Data.reduce((sum, item) => sum + item.percentage, 0) : 100;
                  const isValidTotal = b2Total === 100 && b3Total === 100;
                  
                  return (
                    <span className={`text-xs px-2 py-1 rounded ${
                      isValidTotal 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isValidTotal 
                        ? '✅ 可以儲存' 
                        : `❌ B2:${b2Total}% B3:${b3Total}% (需要=100%)`
                      }
                    </span>
                  );
                })()}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetLocalChanges}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={forceRefreshLocalData}
                  disabled={isLoading}
                >
                  🔄 重新整理
                </Button>
                <Button 
                  size="sm" 
                  onClick={saveLocalChanges}
                  disabled={isLoading || (() => {
                    const b2Total = localB2Data.length > 0 ? localB2Data.reduce((sum, item) => sum + item.percentage, 0) : 100;
                    const b3Total = localB3Data.length > 0 ? localB3Data.reduce((sum, item) => sum + item.percentage, 0) : 100;
                    return b2Total !== 100 || b3Total !== 100;
                  })()}
                  className={(() => {
                    const b2Total = localB2Data.length > 0 ? localB2Data.reduce((sum, item) => sum + item.percentage, 0) : 100;
                    const b3Total = localB3Data.length > 0 ? localB3Data.reduce((sum, item) => sum + item.percentage, 0) : 100;
                    const isValidTotal = b2Total === 100 && b3Total === 100;
                    return isValidTotal 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-gray-400 cursor-not-allowed";
                  })()}
                >
                  {isLoading ? '正在儲存...' : '儲存變更'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helper Actions */}
      {selectedB1 && selectedB2 && b3Data.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-orange-800">未找到 B3 資料</h4>
                <p className="text-sm text-orange-600">
                  已選擇 B1 ({selectedB1}) 和 B2 ({selectedB2})，但沒有對應的 B3 資料
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => selectedB1 && selectedB2 && loadB3Data(selectedB1, selectedB2)}
                disabled={isLoading}
              >
                {isLoading ? '載入中...' : '重新載入 B3 資料'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigate back to dashboard if no selections */}
      {!selectedB1 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800">需要選擇資料</h4>
                <p className="text-sm text-blue-600">
                  請先到儀表板選擇 B1 和 B2，然後返回此頁面進行百分比設定
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
              >
                前往儀表板
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* B2 百分比設定 */}
      {selectedB1 && (localB2Data.length > 0 || b2Data.length > 0) && (
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsB2Expanded(!isB2Expanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsB2Expanded(!isB2Expanded);
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={isB2Expanded}
            aria-label={`${isB2Expanded ? 'Collapse' : 'Expand'} B2 settings section`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  設定 B2 - 依據 B1 篩選：{selectedB1}
                  {(() => {
                    const dataToUse = localB2Data.length > 0 ? localB2Data : b2Data;
                    const total = dataToUse.reduce((sum, item) => sum + item.percentage, 0);
                    const isExact100 = total === 100;
                    return (
                      <span className={`text-sm px-2 py-1 rounded ${
                        isExact100 
                          ? 'text-green-700 bg-green-100' 
                          : total > 100 
                            ? 'text-red-700 bg-red-100'
                            : 'text-orange-700 bg-orange-100'
                      }`}>
                        {total}%
                      </span>
                    );
                  })()}
                </CardTitle>
                <CardDescription>
                  <div className="space-y-2">
                    <div>
                      {(() => {
                        const dataToUse = localB2Data.length > 0 ? localB2Data : b2Data;
                        const total = dataToUse.reduce((sum, item) => sum + item.percentage, 0);
                        const isExact100 = total === 100;
                        return (
                          <div className="flex items-center gap-2">
                            <span>總百分比：</span>
                            <span className={`font-bold text-lg px-2 py-1 rounded ${
                              isExact100 
                                ? 'text-green-700 bg-green-100' 
                                : total > 100 
                                  ? 'text-red-700 bg-red-100'
                                  : 'text-orange-700 bg-orange-100'
                            }`}>
                              {total}%
                            </span>
                            {isExact100 ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                ✅ 完美平衡
                              </span>
                            ) : (
                              <span className="text-xs text-orange-600">
                                {total > 100 ? '⚠️ 超過100%' : '⚠️ 未達100%'} - 變更時自動平衡
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {!selectedB2 && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        💡 <strong>提示：</strong>點擊下方任一 B2 項目即可選擇該項目，然後就能編輯對應的 B3 百分比設定
                      </div>
                    )}
                    {selectedB2 && (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded flex items-center justify-between">
                        <span>✅ 已續約選手機案比較划算，您要手機案嗎？：<strong>{selectedB2}</strong> - 您現在可以在下方編輯對應的 B3 百分比</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('[PercentageConfig] Clearing B2 selection');
                            setSelectedB2('');
                            setB3Data([]);
                            setLocalB3Data([]);
                            setOriginalB3Data([]);
                          }}
                          className="text-xs h-6"
                        >
                          重新續約選手機案比較划算，您要手機案嗎？
                        </Button>
                      </div>
                    )}
                  </div>
                </CardDescription>
              </div>
              <ChevronDown 
                className={`h-5 w-5 transition-transform duration-200 ${
                  isB2Expanded ? 'rotate-0' : 'rotate-180'
                }`} 
              />
            </div>
          </CardHeader>
          {isB2Expanded && (
            <CardContent className="animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    💡 提示：可以自由輸入任何百分比數值，但總和必須等於 100% 才能儲存
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => resetToEvenDistribution('B2')}
                    className="text-xs"
                    title="重設為平均分配"
                  >
                    🔄 平均分配
                  </Button>
                </div>
                {(localB2Data.length > 0 ? localB2Data : b2Data).map((item) => {
                  const originalItem = b2Data.find(orig => orig.value === item.value);
                  const hasChanged = originalItem && originalItem.percentage !== item.percentage;
                  const isSelected = selectedB2 === item.value;
                  
                  return (
                    <div key={item.value} className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                      isSelected 
                        ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' 
                        : hasChanged 
                          ? 'border-amber-300 bg-amber-50' 
                          : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isSelected) {
                        // Select this B2 to enable B3 editing
                        console.log(`[PercentageConfig] Selecting B2: ${item.value}`);
                        setSelectedB2(item.value);
                        if (selectedB1) {
                          loadB3Data(selectedB1, item.value);
                        }
                      }
                    }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.value}</h4>
                          {isSelected && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">已選擇</span>}
                          {hasChanged && <div className="w-2 h-2 bg-amber-500 rounded-full"></div>}
                        </div>
                        {item.count && item.totalCount && (
                          <p className="text-xs text-muted-foreground">
                            {item.count}/{item.totalCount} 次出現
                          </p>
                        )}
                        {!isSelected && (
                          <p className="text-xs text-blue-600 mt-1">點擊選擇此 B2 以編輯對應的 B3 百分比</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          key={`b2-${item.value}`}
                          type="number"
                          min="0"
                          value={inputValues[`b2-${item.value}`] || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const inputKey = `b2-${item.value}`;
                            
                            // Update input state immediately for responsive typing
                            setInputValues(prev => ({
                              ...prev,
                              [inputKey]: inputValue
                            }));
                            
                            // Only update percentage when we have a valid number
                            if (inputValue === '') {
                              // Don't update percentage for empty input
                              return;
                            }
                            
                            const newValue = parseInt(inputValue);
                            
                            // Validate input
                            if (isNaN(newValue)) {
                              console.warn('Invalid input - not a number:', inputValue);
                              return;
                            }
                            
                            if (newValue < 0) {
                              console.warn('Invalid input - negative value:', newValue);
                              return;
                            }
                            
                            // Allow any value, even over 100%
                            console.log('Updating B2 percentage:', { 
                              itemValue: item.value, 
                              oldPercentage: item.percentage, 
                              newValue 
                            });
                            
                            updateLocalPercentage('B2', item.value, newValue);
                          }}
                          onBlur={(e) => {
                            // Sync back to actual percentage on blur if input is empty
                            const inputValue = e.target.value;
                            if (inputValue === '') {
                              const inputKey = `b2-${item.value}`;
                              setInputValues(prev => ({
                                ...prev,
                                [inputKey]: item.percentage.toString()
                              }));
                            }
                          }}
                          className="w-16 h-7 text-center text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      
                      <div className="w-24">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* B3 百分比設定 */}
      {selectedB1 && selectedB2 && (localB3Data.length > 0 || b3Data.length > 0) && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader 
            className="cursor-pointer hover:bg-green-100 transition-colors duration-200"
            onClick={() => setIsB3Expanded(!isB3Expanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsB3Expanded(!isB3Expanded);
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={isB3Expanded}
            aria-label={`${isB3Expanded ? 'Collapse' : 'Expand'} B3 settings section`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  🎯 設定 B3 - 依據選擇的 B1：{selectedB1}，B2：{selectedB2}
                  {(() => {
                    const dataToUse = localB3Data.length > 0 ? localB3Data : b3Data;
                    const total = dataToUse.reduce((sum, item) => sum + item.percentage, 0);
                    const isExact100 = total === 100;
                    return (
                      <span className={`text-sm px-2 py-1 rounded ${
                        isExact100 
                          ? 'text-green-700 bg-green-200' 
                          : total > 100 
                            ? 'text-red-700 bg-red-200'
                            : 'text-orange-700 bg-orange-200'
                      }`}>
                        {total}%
                      </span>
                    );
                  })()}
                </CardTitle>
                <CardDescription>
                  {(() => {
                    const dataToUse = localB3Data.length > 0 ? localB3Data : b3Data;
                    const total = dataToUse.reduce((sum, item) => sum + item.percentage, 0);
                    const isExact100 = total === 100;
                    return (
                      <div className="flex items-center gap-2">
                        <span>總百分比：</span>
                        <span className={`font-bold text-lg px-2 py-1 rounded ${
                          isExact100 
                            ? 'text-green-700 bg-green-100' 
                            : total > 100 
                              ? 'text-red-700 bg-red-100'
                              : 'text-orange-700 bg-orange-100'
                        }`}>
                          {total}%
                        </span>
                        {isExact100 ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            ✅ 完美平衡
                          </span>
                        ) : (
                          <span className="text-xs text-orange-600">
                            {total > 100 ? '⚠️ 超過100%' : '⚠️ 未達100%'} - 變更時自動平衡
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </CardDescription>
              </div>
              <ChevronDown 
                className={`h-5 w-5 transition-transform duration-200 text-green-700 ${
                  isB3Expanded ? 'rotate-0' : 'rotate-180'
                }`} 
              />
            </div>
          </CardHeader>
          {isB3Expanded && (
            <CardContent className="animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    💡 提示：可以自由輸入任何百分比數值，但總和必須等於 100% 才能儲存
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => resetToEvenDistribution('B3')}
                    className="text-xs"
                    title="重設為平均分配"
                  >
                    🔄 平均分配
                  </Button>
                </div>
                {(localB3Data.length > 0 ? localB3Data : b3Data).map((item) => {
                  const originalItem = b3Data.find(orig => orig.value === item.value);
                  const hasChanged = originalItem && originalItem.percentage !== item.percentage;
                  
                  return (
                    <div key={item.value} className={`flex items-center gap-4 p-4 border rounded-lg ${hasChanged ? 'border-amber-300 bg-amber-50' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.value}</h4>
                          {hasChanged && <div className="w-2 h-2 bg-amber-500 rounded-full"></div>}
                        </div>
                        {item.count && item.totalCount && (
                          <p className="text-xs text-muted-foreground">
                            {item.count}/{item.totalCount} 次出現
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          key={`b3-${item.value}`}
                          type="number"
                          min="0"
                          value={inputValues[`b3-${item.value}`] || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const inputKey = `b3-${item.value}`;
                            
                            // Update input state immediately for responsive typing
                            setInputValues(prev => ({
                              ...prev,
                              [inputKey]: inputValue
                            }));
                            
                            // Only update percentage when we have a valid number
                            if (inputValue === '') {
                              // Don't update percentage for empty input
                              return;
                            }
                            
                            const newValue = parseInt(inputValue);
                            
                            // Validate input
                            if (isNaN(newValue)) {
                              console.warn('Invalid input - not a number:', inputValue);
                              return;
                            }
                            
                            if (newValue < 0) {
                              console.warn('Invalid input - negative value:', newValue);
                              return;
                            }
                            
                            // Allow any value, even over 100%
                            console.log('Updating B3 percentage:', { 
                              itemValue: item.value, 
                              oldPercentage: item.percentage, 
                              newValue 
                            });
                            
                            updateLocalPercentage('B3', item.value, newValue);
                          }}
                          onBlur={(e) => {
                            // Sync back to actual percentage on blur if input is empty
                            const inputValue = e.target.value;
                            if (inputValue === '') {
                              const inputKey = `b3-${item.value}`;
                              setInputValues(prev => ({
                                ...prev,
                                [inputKey]: item.percentage.toString()
                              }));
                            }
                          }}
                          className="w-16 h-7 text-center text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      
                      <div className="w-24">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* B3 Detail Management */}
      {selectedB1 && selectedB2 && selectedB3 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800 flex items-center gap-2">
              📋 B3 詳細資料管理
            </CardTitle>
            <CardDescription>
              管理 B3 詳細資料的百分比設定 - B1：{selectedB1}，B2：{selectedB2}，B3：{selectedB3}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  💡 點擊按鈕查看和編輯 B3 詳細資料
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => selectedB3 && loadB3Details(selectedB3)}
                    disabled={isLoadingB3Details}
                    className="gap-2"
                  >
                    {isLoadingB3Details ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    載入詳細資料
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedB3('');
                      setB3Details([]);
                      setLocalB3Details([]);
                      setHasB3DetailChanges(false);
                    }}
                    className="gap-2"
                  >
                    重新最划算的資費
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={forceReloadB3Details}
                    disabled={isLoadingB3Details}
                    className="gap-2"
                    title="強制重新載入詳細資料"
                  >
                    🔄 強制重新載入
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetB3DetailsToNatural}
                    disabled={localB3Details.length === 0}
                    className="gap-2"
                    title="重設為自然百分比"
                  >
                    🔄 重設為自然值
                  </Button>
                </div>
              </div>

              {/* B3 Details Display */}
              {!isLoadingB3Details && localB3Details.length > 0 && (
                <div className="space-y-4">
                  {/* Save/Cancel Panel for B3 Details */}
                  {hasB3DetailChanges && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="text-sm font-medium">有未儲存的 B3 詳細資料變更</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={resetB3DetailChanges}
                              disabled={isLoading}
                            >
                              取消
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={saveB3DetailChanges}
                              disabled={isLoading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isLoading ? '正在儲存...' : '儲存 B3 詳細資料'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Total Percentage Display */}
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">總百分比:</span>
                      {(() => {
                        const total = localB3Details.reduce((sum, item) => {
                          const configuredPercentage = item?.configuredPercentage;
                          return sum + (configuredPercentage !== undefined ? configuredPercentage : item?.percentage || 0);
                        }, 0);
                        const isExact100 = Math.abs(total - 100) < 0.01; // Allow small floating point errors
                        return (
                          <span className={`text-sm font-bold px-2 py-1 rounded ${
                            isExact100 
                              ? 'text-green-700 bg-green-100' 
                              : total > 100 
                                ? 'text-red-700 bg-red-100'
                                : 'text-orange-700 bg-orange-100'
                          }`}>
                            {total.toFixed(1)}%
                            {isExact100 ? ' ✅' : total > 100 ? ' ⚠️ 超過100%' : ' ⚠️ 未達100%'}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 可以自由調整各詳細資料的百分比，不強制要求總和為100%
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {localB3Details.map((item, index) => {
                      const safeItem = {
                        detail: item?.detail || '無詳細資料',
                        count: item?.count || 0,
                        totalCount: item?.totalCount || 0,
                        percentage: typeof item?.percentage === 'number' ? item.percentage : 0,
                        configuredPercentage: typeof item?.configuredPercentage === 'number' ? item.configuredPercentage : undefined
                      };

                      const hasChanged = safeItem.configuredPercentage !== undefined && 
                                       Math.abs(safeItem.configuredPercentage - safeItem.percentage) > 0.01;

                      return (
                        <Card key={`detail-${index}`} className={`border ${hasChanged ? 'border-amber-300 bg-amber-50' : ''}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{safeItem.detail}</p>
                                {hasChanged && <div className="w-2 h-2 bg-amber-500 rounded-full"></div>}
                              </div>
                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>出現: {safeItem.count}次 / 總數: {safeItem.totalCount}</span>
                                <span>自然比例: {safeItem.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={safeItem.configuredPercentage !== undefined ? safeItem.configuredPercentage : safeItem.percentage}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value) || 0;
                                    updateLocalB3DetailPercentage(safeItem.detail, newValue);
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border rounded"
                                />
                                <span className="text-xs">%</span>
                                {safeItem.configuredPercentage !== undefined && (
                                  <span className="text-xs text-green-600 bg-green-100 px-1 rounded">
                                    已設定
                                  </span>
                                )}
                              </div>
                              {hasChanged && (
                                <div className="text-xs text-amber-600">
                                  已修改: {safeItem.percentage.toFixed(1)}% → {safeItem.configuredPercentage?.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isLoadingB3Details && localB3Details.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>尚未載入詳細資料</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* B3 Selection for Detail Management */}
      {selectedB1 && selectedB2 && !selectedB3 && (localB3Data.length > 0 || b3Data.length > 0) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              🎯 最划算的資費 以編輯詳細資料
            </CardTitle>
            <CardDescription>
              請選擇一個 B3 項目來查看和編輯其詳細資料的百分比 - B1：{selectedB1}，B2：{selectedB2}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                💡 點擊下方任一 B3 項目來選擇並編輯其詳細資料
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localB3Data.length > 0 ? localB3Data : b3Data).map((item) => (
                  <Card 
                    key={item.value} 
                    className="border cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                    onClick={() => {
                      console.log(`[PercentageConfig] Selecting B3 for detail management: ${item.value}`);
                      // Set selectedB3 in context
                      if (window.location.pathname.includes('/admin/percentage-config')) {
                        // Update URL to include B3 selection
                        window.history.pushState(null, '', `/admin/percentage-config?b3=${item.value}`);
                      }
                      // You might need to add selectedB3 to your context or use a different approach
                      // For now, we'll use a simple state update
                      setSelectedB3(item.value);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-lg">{item.value}</h4>
                          <span className="text-sm font-semibold text-blue-600">{item.percentage}%</span>
                        </div>
                        {item.count && item.totalCount && (
                          <p className="text-xs text-muted-foreground">
                            {item.count}/{item.totalCount} 次出現
                          </p>
                        )}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-600 text-center">
                          點擊選擇此 B3
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 說明 */}
      {(!selectedB1 || (b2Data.length === 0 && b3Data.length === 0)) && (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">無資料可設定</h3>
            <p className="text-muted-foreground mb-4">
              請在儀表板中選擇 B1 和 B2 以獲得可設定百分比的資料。
            </p>
            <Button onClick={() => navigate('/admin/dashboard')} className="gap-2">
              <Home className="h-4 w-4" />
              前往儀表板
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PercentageConfig; 