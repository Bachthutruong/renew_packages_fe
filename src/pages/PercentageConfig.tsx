import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataAPI } from '../services/api';
import { DataWithPercentage } from '../types';
import { useDataSelection } from '../context/DataSelectionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Home,
  ArrowLeft,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const PercentageConfig: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedB1,
    selectedB2,
    b2Data,
    b3Data,
    setB2Data,
    setB3Data,
    resetFlow
  } = useDataSelection();
  
  // Original server data for comparison
  const [originalB2Data, setOriginalB2Data] = useState<DataWithPercentage[]>([]);
  const [originalB3Data, setOriginalB3Data] = useState<DataWithPercentage[]>([]);
  
  // Local percentage states for better UX
  const [localB2Data, setLocalB2Data] = useState<DataWithPercentage[]>([]);
  const [localB3Data, setLocalB3Data] = useState<DataWithPercentage[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load initial data when we have selections
    if (selectedB1) {
      loadB2Data(selectedB1);
    }
    if (selectedB1 && selectedB2) {
      loadB3Data(selectedB1, selectedB2);
    }
  }, [selectedB1, selectedB2]);

  const loadB2Data = async (b1Value: string) => {
    try {
      console.log(`[loadB2Data] Loading B2 data for B1: ${b1Value}`);
      const data = await dataAPI.getB2Data(b1Value);
      console.log(`[loadB2Data] Server returned:`, data);
      
      // Save original server data
      setOriginalB2Data([...data]);
      setB2Data(data);
      
      // Only initialize local state if not already set or no local changes
      if (localB2Data.length === 0 || !hasLocalChanges) {
        console.log('[loadB2Data] Initializing localB2Data from server data');
        setLocalB2Data(data);
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
      
      // Save original server data
      setOriginalB3Data([...data]);
      setB3Data(data);
      
      // Only initialize local state if not already set or no local changes
      if (localB3Data.length === 0 || !hasLocalChanges) {
        console.log('[loadB3Data] Initializing localB3Data from server data');
        setLocalB3Data(data);
      } else {
        console.log('[loadB3Data] Keeping existing localB3Data (has unsaved changes)');
        console.log('[loadB3Data] Current localB3Data:', localB3Data);
      }
    } catch (error: any) {
      console.error('Failed to load B3 data:', error);
      toast.error('無法載入 B3 資料');
    }
  };

  // Local percentage management with auto-balance
  const updateLocalPercentage = (type: 'B2' | 'B3', value: string, newPercentage: number) => {
    console.log(`updateLocalPercentage called:`, { type, value, newPercentage });
    
    if (type === 'B2') {
      // Initialize from server data if local data is empty
      const currentData = localB2Data.length > 0 ? localB2Data : b2Data;
      console.log('B2 currentData:', currentData);
      
      // Auto-balance logic
      const updatedData = [...currentData];
      const targetIndex = updatedData.findIndex(item => item.value === value);
      if (targetIndex === -1) {
        console.log('Target item not found!', { value, targetIndex });
        return;
      }
      
      console.log('Before update:', updatedData[targetIndex]);
      
      // Update target item
      updatedData[targetIndex].percentage = newPercentage;
      
      // Distribute the difference among other items
      const otherItems = updatedData.filter((_, index) => index !== targetIndex);
      console.log('Other items:', otherItems);
      
      if (otherItems.length > 0) {
        const totalOtherPercentage = otherItems.reduce((sum, item) => sum + item.percentage, 0);
        const newTotalOther = 100 - newPercentage;
        
        console.log('Auto-balance calculation:', { 
          totalOtherPercentage, 
          newTotalOther, 
          newPercentage 
        });
        
        if (newTotalOther >= 0) {
          // Distribute proportionally or evenly
          if (totalOtherPercentage > 0) {
            // Proportional distribution
            console.log('Using proportional distribution');
            otherItems.forEach((item) => {
              const proportion = item.percentage / totalOtherPercentage;
              const newValue = Math.round(newTotalOther * proportion);
              const originalIndex = updatedData.findIndex(d => d.value === item.value);
              console.log(`Updating ${item.value}: ${item.percentage}% → ${newValue}%`);
              updatedData[originalIndex].percentage = Math.max(0, newValue);
            });
          } else {
            // Even distribution
            console.log('Using even distribution');
            const evenShare = Math.floor(newTotalOther / otherItems.length);
            const remainder = newTotalOther % otherItems.length;
            
            otherItems.forEach((item, index) => {
              const originalIndex = updatedData.findIndex(d => d.value === item.value);
              const newValue = evenShare + (index < remainder ? 1 : 0);
              console.log(`Even distribution ${item.value}: ${item.percentage}% → ${newValue}%`);
              updatedData[originalIndex].percentage = newValue;
            });
          }
        }
      }
      
      console.log('Final B2 data:', updatedData);
      setLocalB2Data(updatedData);
    } else {
      // Same logic for B3 with debugging
      const currentData = localB3Data.length > 0 ? localB3Data : b3Data;
      console.log('B3 currentData:', currentData);
      
      const updatedData = [...currentData];
      const targetIndex = updatedData.findIndex(item => item.value === value);
      if (targetIndex === -1) {
        console.log('B3 Target item not found!', { value, targetIndex });
        return;
      }
      
      // Update target item
      updatedData[targetIndex].percentage = newPercentage;
      
      const otherItems = updatedData.filter((_, index) => index !== targetIndex);
      
      if (otherItems.length > 0) {
        const totalOtherPercentage = otherItems.reduce((sum, item) => sum + item.percentage, 0);
        const newTotalOther = 100 - newPercentage;
        
        if (newTotalOther >= 0) {
          if (totalOtherPercentage > 0) {
            otherItems.forEach((item) => {
              const proportion = item.percentage / totalOtherPercentage;
              const newValue = Math.round(newTotalOther * proportion);
              const originalIndex = updatedData.findIndex(d => d.value === item.value);
              updatedData[originalIndex].percentage = Math.max(0, newValue);
            });
          } else {
            const evenShare = Math.floor(newTotalOther / otherItems.length);
            const remainder = newTotalOther % otherItems.length;
            
            otherItems.forEach((item, index) => {
              const originalIndex = updatedData.findIndex(d => d.value === item.value);
              updatedData[originalIndex].percentage = evenShare + (index < remainder ? 1 : 0);
            });
          }
        }
      }
      
      console.log('Final B3 data:', updatedData);
      setLocalB3Data(updatedData);
    }
    setHasLocalChanges(true);
  };

  const saveLocalChanges = async () => {
    if (!hasLocalChanges) return;
    
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

      {/* 目前選擇狀態 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">正在設定：</span>
            </div>
            <div className="flex items-center gap-4">
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
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isLoading ? '正在儲存...' : '儲存變更'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* B2 百分比設定 */}
      {selectedB1 && (localB2Data.length > 0 || b2Data.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>設定 B2 - 依據 B1 篩選：{selectedB1}</CardTitle>
            <CardDescription>
              {(() => {
                const total = (localB2Data.length > 0 ? localB2Data : b2Data).reduce((sum, item) => sum + item.percentage, 0);
                const isExact100 = total === 100;
                return (
                  <div className="flex items-center gap-2">
                    <span>總百分比：</span>
                    <span className={`font-medium ${isExact100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {total}%
                    </span>
                    {!isExact100 && (
                      <span className="text-xs text-amber-600">（變更時自動平衡）</span>
                    )}
                  </div>
                );
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(localB2Data.length > 0 ? localB2Data : b2Data).map((item) => {
                const originalItem = b2Data.find(orig => orig.value === item.value);
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
                        key={`b2-${item.value}-${item.percentage}`}
                        type="number"
                        min="0"
                        max="100"
                        value={item.percentage}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === '') return; // Don't update on empty input
                          
                          const newValue = parseInt(inputValue);
                          if (isNaN(newValue) || newValue < 0 || newValue > 100) return;
                          
                          console.log('Updating B2 percentage:', { 
                            itemValue: item.value, 
                            oldPercentage: item.percentage, 
                            newValue 
                          });
                          updateLocalPercentage('B2', item.value, newValue);
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
        </Card>
      )}

      {/* B3 百分比設定 */}
      {selectedB1 && selectedB2 && (localB3Data.length > 0 || b3Data.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>設定 B3 - 依據 B1 篩選：{selectedB1}，B2：{selectedB2}</CardTitle>
            <CardDescription>
              {(() => {
                const total = (localB3Data.length > 0 ? localB3Data : b3Data).reduce((sum, item) => sum + item.percentage, 0);
                const isExact100 = total === 100;
                return (
                  <div className="flex items-center gap-2">
                    <span>總百分比：</span>
                    <span className={`font-medium ${isExact100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {total}%
                    </span>
                    {!isExact100 && (
                      <span className="text-xs text-amber-600">（變更時自動平衡）</span>
                    )}
                  </div>
                );
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                        key={`b3-${item.value}-${item.percentage}`}
                        type="number"
                        min="0"
                        max="100"
                        value={item.percentage}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === '') return; // Don't update on empty input
                          
                          const newValue = parseInt(inputValue);
                          if (isNaN(newValue) || newValue < 0 || newValue > 100) return;
                          
                          console.log('Updating B3 percentage:', { 
                            itemValue: item.value, 
                            oldPercentage: item.percentage, 
                            newValue 
                          });
                          updateLocalPercentage('B3', item.value, newValue);
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