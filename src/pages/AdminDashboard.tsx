import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataAPI, phoneBrandsAPI } from '../services/api';
import { PhoneBrand } from '../types';
import { useDataSelection } from '../context/DataSelectionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
// import { Input } from '../components/ui/input';
import { 
  ChevronRight,
  ArrowLeft,
  // Search,
  Eye,
  Phone,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'select-b1' | 'select-b2' | 'select-b3';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedB1,
    selectedB2,
    selectedB3,
    b2Data,
    b3Data,
    setSelectedB1,
    setSelectedB2,
    setSelectedB3,
    setB2Data,
    setB3Data,
    resetFlow
  } = useDataSelection();
  
  // Data states
  const [b1Values, setB1Values] = useState<string[]>([]);
  const [b3Details, setB3Details] = useState<string[]>([]);
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  
  // Navigation states - removed currentStep, using individual states  
  const [currentStep, setCurrentStep] = useState<Step>('select-b1');
  
  // UI states
  const [searchB1, setSearchB1] = useState<string>('');
  const [showB3Details, setShowB3Details] = useState(false);
  const [showPhoneBrands, setShowPhoneBrands] = useState(false);
  const [b3DetailsSource, setB3DetailsSource] = useState<'B2' | 'B3'>('B3');
  
  // Loading states
  const [isLoadingB1, setIsLoadingB1] = useState(false);
  const [isLoadingB2, setIsLoadingB2] = useState(false);
  const [isLoadingB3, setIsLoadingB3] = useState(false);
  const [isLoadingB3Details, setIsLoadingB3Details] = useState(false);
  const [isLoadingPhoneBrands, setIsLoadingPhoneBrands] = useState(false);

  // Expansion states for each section
  const [isB1Expanded, setIsB1Expanded] = useState(true);
  const [isB2Expanded, setIsB2Expanded] = useState(false);
  const [isB3Expanded, setIsB3Expanded] = useState(false);

  const isPhoneCase = selectedB2 === '手機案';

  useEffect(() => {
    // Load initial data in parallel
    Promise.all([
      loadB1Values(),
      loadPhoneBrands()
    ]).catch(console.error);
  }, []);

  // Auto-navigate to percentage config when data is ready (for admin)
  useEffect(() => {
    if (selectedB1 && b2Data.length > 0) {
      console.log('Auto-navigating to percentage-config because B2 data is available');
      navigate('/admin/percentage-config');
    }
  }, [selectedB1, b2Data.length, navigate]);

  const loadB1Values = async () => {
    setIsLoadingB1(true);
    try {
      const values = await dataAPI.getB1Values();
      // Sắp xếp theo thứ tự tăng dần (số trước, chữ sau)
      const sortedValues = values.sort((a, b) => {
        // Thử parse thành số để so sánh số học
        const numA = parseFloat(a.match(/\d+/)?.[0] || '0');
        const numB = parseFloat(b.match(/\d+/)?.[0] || '0');
        
        if (numA !== numB) {
          return numA - numB; // Sắp xếp theo số
        }
        
        // Nếu số bằng nhau, sắp xếp theo chữ cái
        return a.localeCompare(b, 'zh-TW', { numeric: true, sensitivity: 'base' });
      });
      
      console.log('[AdminDashboard] Sorted B1 values:', sortedValues);
      setB1Values(sortedValues);
    } catch (error: any) {
      console.error('Failed to load B1 values:', error);
    } finally {
      setIsLoadingB1(false);
    }
  };

  const loadPhoneBrands = async () => {
    setIsLoadingPhoneBrands(true);
    try {
      const brands = await phoneBrandsAPI.getAll();
      // Sort by percentage descending (highest first)
      const sortedBrands = [...brands].sort((a, b) => b.percentage - a.percentage);
      setPhoneBrands(sortedBrands);
    } catch (error: any) {
      console.error('Failed to load phone brands:', error);
    } finally {
      setIsLoadingPhoneBrands(false);
    }
  };

  const loadB3Details = async () => {
    if (!selectedB1 || !selectedB2 || !selectedB3) return;
    
    setIsLoadingB3Details(true);
    try {
      const details = await dataAPI.getB3Details(selectedB1, selectedB2, selectedB3);
      setB3Details(details);
      setB3DetailsSource('B3');
      setShowB3Details(true);
    } catch (error: any) {
      console.error('Failed to load B3 details:', error);
    } finally {
      setIsLoadingB3Details(false);
    }
  };

  const loadB3DetailsForB2 = async () => {
    if (!selectedB1 || !selectedB2) return;
    
    setIsLoadingB3Details(true);
    try {
      const b3DataForCombo = await dataAPI.getB3Data(selectedB1, selectedB2);
      const allDetails: string[] = [];
      
      // Process in batches for better performance
      const batchSize = 5;
      for (let i = 0; i < b3DataForCombo.length; i += batchSize) {
        const batch = b3DataForCombo.slice(i, i + batchSize);
        const batchPromises = batch.map(b3Item => 
          dataAPI.getB3Details(selectedB1, selectedB2, b3Item.value)
        );
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(details => allDetails.push(...details));
      }
      
      setB3Details(allDetails);
      setB3DetailsSource('B2');
      setShowB3Details(true);
    } catch (error: any) {
      console.error('Failed to load B3 details for B2:', error);
    } finally {
      setIsLoadingB3Details(false);
    }
  };

  const handleB1Select = async (value: string) => {
    setSelectedB1(value);
    setSelectedB2('');
    setSelectedB3('');
    
    // Collapse B1 section and expand B2
    setIsB1Expanded(false);
    setIsB2Expanded(true);
    
    // Show loading state immediately and clear previous data
    setIsLoadingB2(true);
    setB2Data([]);
    
    try {
      console.log(`[AdminDashboard] Loading B2 data for B1: ${value}`);
      const data = await dataAPI.getB2Data(value);
      console.log(`[AdminDashboard] Loaded ${data.length} B2 items for B1: ${value}`);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      setB2Data(sortedData);
    } catch (error: any) {
      console.error('Failed to load B2 data:', error);
      toast.error('無法載入 B2 資料');
    } finally {
      setIsLoadingB2(false);
    }
  };

  const handleB2Select = async (value: string) => {
    setSelectedB2(value);
    setSelectedB3('');
    
    // Collapse B2 section and expand B3
    setIsB2Expanded(false);
    setIsB3Expanded(true);
    
    if (!selectedB1) return;
    
    // Show loading immediately and clear previous data
    setIsLoadingB3(true);
    setB3Data([]);
    
    try {
      console.log(`[AdminDashboard] Loading B3 data for B1: ${selectedB1}, B2: ${value}`);
      const data = await dataAPI.getB3Data(selectedB1, value);
      console.log(`[AdminDashboard] Loaded ${data.length} B3 items for B1: ${selectedB1}, B2: ${value}`);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      setB3Data(sortedData);
    } catch (error: any) {
      console.error('Failed to load B3 data:', error);
      toast.error('無法載入 B3 資料');
    } finally {
      setIsLoadingB3(false);
    }
  };

  const handleMoveToB3 = async () => {
    if (!selectedB1 || !selectedB2) return;
    
    // Expand B3 section
    setIsB3Expanded(true);
    
    // Show loading state immediately and clear previous data
    setIsLoadingB3(true);
    setB3Data([]);
    
    try {
      console.log(`[AdminDashboard] Loading B3 data for B1: ${selectedB1}, B2: ${selectedB2}`);
      const data = await dataAPI.getB3Data(selectedB1, selectedB2);
      console.log(`[AdminDashboard] Loaded ${data.length} B3 items for B1: ${selectedB1}, B2: ${selectedB2}`);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      setB3Data(sortedData);
    } catch (error: any) {
      console.error('Failed to load B3 data:', error);
      toast.error('無法載入 B3 資料');
    } finally {
      setIsLoadingB3(false);
    }
  };

  const handleB3Select = (value: string) => {
    setSelectedB3(value);
  };

  const goBack = () => {
    if (currentStep === 'select-b2') {
      setSelectedB1('');
      setSelectedB2('');
      setCurrentStep('select-b1');
      setB2Data([]);
    } else if (currentStep === 'select-b3') {
      setSelectedB2('');
      setSelectedB3('');
      setCurrentStep('select-b2');
      setB3Data([]);
    }
  };

  const handleResetFlow = () => {
    resetFlow();
    setCurrentStep('select-b1');
    setSearchB1('');
  };

  const filteredB1Values = b1Values.filter(value => 
    value.toLowerCase().includes(searchB1.toLowerCase())
  );

  const openPhoneBrandsModal = async () => {
    try {
      await loadPhoneBrands();
      setShowPhoneBrands(true);
    } catch (error: any) {
      console.error('Failed to load phone brands:', error);
    }
  };

  const renderBreadcrumb = () => (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {/* <span className={currentStep === 'select-b1' ? 'text-foreground font-medium' : 'cursor-pointer hover:text-foreground'} 
            onClick={() => currentStep !== 'select-b1' && handleResetFlow()}>
        選擇 B1
      </span> */}
      {selectedB1 && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary font-medium">{selectedB1}</span>
          {currentStep !== 'select-b1' && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className={currentStep === 'select-b2' ? 'text-foreground font-medium' : 'cursor-pointer hover:text-foreground'} 
                    onClick={() => currentStep === 'select-b3' && goBack()}>
                選擇 B2
              </span>
            </>
          )}
        </>
      )}
      {selectedB2 && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary font-medium">{selectedB2}</span>
          {currentStep === 'select-b3' && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">選擇 B3</span>
            </>
          )}
        </>
      )}
    </div>
  );

  const renderSelectB1Screen = () => (
    <div className="space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold mb-2">步驟 1：選擇 B1</h2>
        <p className="text-muted-foreground">選擇一個 B1 數值以開始資料篩選過程</p>
      </div> */}

      {/* 搜尋 */}
      {/* <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋 B1 數值..."
              value={searchB1}
              onChange={(e) => setSearchB1(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card> */}

      {/* B1 數值 */}
      <Card>
        <CardHeader>
          <CardTitle>選您目前的資費</CardTitle>
          {/* <CardDescription>
            按照遞增順序排序
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          {isLoadingB1 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>正在載入 B1 資料...</p>
              </div>
            </div>
          ) : filteredB1Values.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              找不到符合的 B1 數值
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {filteredB1Values.map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  onClick={() => handleB1Select(value)}
                  className="h-auto p-4 text-left justify-start hover:bg-primary hover:text-primary-foreground"
                >
                  <div className="truncate">{value}</div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSelectB2Screen = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">步驟 2：選擇 B2</h2>
          <p className="text-muted-foreground">選擇一個依據 B1 篩選的 B2 數值：<span className="font-semibold text-foreground">{selectedB1}</span></p>
        </div>
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>B2 數值清單</CardTitle>
          <CardDescription>
            基於在 B1：{selectedB1} 中出現頻率的百分比
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingB2 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>正在載入 B2 資料...</p>
              </div>
            </div>
          ) : b2Data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              找不到任何 B2 數值
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {b2Data.map((item) => (
                <Card
                  key={item.value}
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    selectedB2 === item.value
                      ? 'ring-2 ring-primary shadow-md bg-primary/5 border-primary'
                      : 'hover:bg-muted/50 hover:border-primary'
                  }`}
                  onClick={() => handleB2Select(item.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium truncate flex-1">{item.value}</h4>
                      <span className="text-sm font-semibold text-primary ml-2">{item.percentage}%</span>
                    </div>
                    
                    {item.count && item.totalCount && (
                      <div className="text-xs text-muted-foreground mb-3">
                        {item.count} / {item.totalCount} 次出現
                      </div>
                    )}
                    
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* B2 選擇後的操作按鈕 */}
      {selectedB2 && (
        <Card>
          <CardHeader>
            <CardTitle>對 B2 的操作：{selectedB2}</CardTitle>
            <CardDescription>
              所選 B2 數值的可用選項
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleMoveToB3} className="gap-2">
                <ChevronRight className="h-4 w-4" />
                續約划算的資費
              </Button>
              
              <Button 
                onClick={loadB3DetailsForB2} 
                variant="outline" 
                className="gap-2"
                disabled={isLoadingB3Details}
              >
                {isLoadingB3Details ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                續約划算的專案資料
              </Button>
              
              {isPhoneCase && (
                <Button 
                  onClick={openPhoneBrandsModal} 
                  variant="secondary" 
                  className="gap-2"
                  disabled={isLoadingPhoneBrands}
                >
                  {isLoadingPhoneBrands ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                  檢視手機品牌
                </Button>
              )}
              
              <Button onClick={handleResetFlow} variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                重新分析
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSelectB3Screen = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">步驟 3：選擇 B3</h2>
          <p className="text-muted-foreground">
            選擇一個依據 B1：<span className="font-semibold text-foreground">{selectedB1}</span> 和 B2：<span className="font-semibold text-foreground">{selectedB2}</span> 篩選的 B3 數值
          </p>
        </div>
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>B3 數值清單</CardTitle>
          <CardDescription>
            基於依據 B1：{selectedB1} 和 B2：{selectedB2} 篩選的出現頻率的百分比
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingB3 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>正在載入 B3 資料...</p>
              </div>
            </div>
          ) : b3Data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              找不到任何 B3 數值
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {b3Data.map((item) => (
                <Card
                  key={item.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedB3 === item.value
                      ? 'ring-2 ring-primary shadow-md bg-primary/5'
                      : 'hover:bg-muted/50 border-2 hover:border-primary'
                  }`}
                  onClick={() => handleB3Select(item.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium truncate flex-1">{item.value}</h4>
                      <span className="text-sm font-semibold text-primary ml-2">{item.percentage}%</span>
                    </div>
                    
                    {item.count && item.totalCount && (
                      <div className="text-xs text-muted-foreground mb-3">
                        {item.count} / {item.totalCount} 次出現
                      </div>
                    )}
                    
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 操作按鈕 */}
          {selectedB3 && (
            <div className="border-t pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>對 B3 的操作：{selectedB3}</CardTitle>
                  <CardDescription>
                    所選 B3 數值的可用選項
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={loadB3Details} 
                      className="gap-2"
                      disabled={isLoadingB3Details}
                    >
                      {isLoadingB3Details ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      續約划算的專案資料
                    </Button>
                    {isPhoneCase && (
                      <Button 
                        onClick={openPhoneBrandsModal} 
                        variant="secondary" 
                        className="gap-2"
                        disabled={isLoadingPhoneBrands}
                      >
                        {isLoadingPhoneBrands ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                        檢視手機品牌
                      </Button>
                    )}
                    <Button onClick={handleResetFlow} variant="outline" className="gap-2">
                      <Settings className="h-4 w-4" />
                      重新分析
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderBreadcrumb()}
      
      {/* B1 Selection Section */}
      <Card className={`transition-all duration-300 ${selectedB1 ? 'bg-green-50 border-green-200' : ''}`}>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setIsB1Expanded(!isB1Expanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                步驟 1：選您目前的資費
                {selectedB1 && <span className="text-green-600">✓ {selectedB1}</span>}
              </CardTitle>
            </div>
            <ChevronRight className={`h-5 w-5 transition-transform ${isB1Expanded ? 'rotate-90' : ''}`} />
          </div>
        </CardHeader>
        {isB1Expanded && (
          <CardContent>
            {renderSelectB1Screen()}
          </CardContent>
        )}
      </Card>

      {/* B2 Selection Section */}
      {selectedB1 && (
        <Card className={`transition-all duration-300 ${selectedB2 ? 'bg-green-50 border-green-200' : ''}`}>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setIsB2Expanded(!isB2Expanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  步驟 2：選擇 B2
                  {selectedB2 && <span className="text-green-600">✓ {selectedB2}</span>}
                </CardTitle>
                <CardDescription>
                  基於 {selectedB1} 的選項
                </CardDescription>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${isB2Expanded ? 'rotate-90' : ''}`} />
            </div>
          </CardHeader>
          {isB2Expanded && (
            <CardContent>
              {renderSelectB2Screen()}
            </CardContent>
          )}
        </Card>
      )}

      {/* B3 Selection Section */}
      {selectedB2 && (
        <Card className={`transition-all duration-300 ${selectedB3 ? 'bg-green-50 border-green-200' : ''}`}>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setIsB3Expanded(!isB3Expanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  步驟 3：選擇 B3
                  {selectedB3 && <span className="text-green-600">✓ {selectedB3}</span>}
                </CardTitle>
                <CardDescription>
                  基於 {selectedB1} → {selectedB2} 的選項
                </CardDescription>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${isB3Expanded ? 'rotate-90' : ''}`} />
            </div>
          </CardHeader>
          {isB3Expanded && (
            <CardContent>
              {renderSelectB3Screen()}
            </CardContent>
          )}
        </Card>
      )}

      {/* B3 詳細資料對話框 */}
      <Dialog open={showB3Details} onOpenChange={setShowB3Details}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {b3DetailsSource === 'B3' 
                ? `B3 管理：${selectedB3}` 
                : `B1：${selectedB1}、B2：${selectedB2} 的 B3 管理`
              }
            </DialogTitle>
            <DialogDescription>
              {b3DetailsSource === 'B3'
                ? `管理所選 B3 的詳細資料及百分比設定`
                : `管理所選 B1 和 B2 組合的所有 B3 百分比設定`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* 如果是 B3 source，顯示當前選中的 B3 項目 */}
            {b3DetailsSource === 'B3' && selectedB3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {b3Data.filter(item => item.value === selectedB3).map((item) => (
                  <Card key={item.value} className="border-2 border-primary bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-lg">{item.value}</h4>
                        <span className="text-lg font-bold text-primary">{item.percentage}%</span>
                      </div>
                      
                      {item.count && item.totalCount && (
                        <div className="text-sm text-muted-foreground mb-3">
                          {item.count} / {item.totalCount} 次出現
                        </div>
                      )}
                      
                      <div className="w-full bg-muted rounded-full h-3 mb-4">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>

                      {/* Admin percentage editing */}
                      <div className="pt-3 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate('/admin/percentage-config')}
                        >
                          調整百分比
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 如果是 B2 source，顯示所有 B3 數據並允許管理 */}
            {b3DetailsSource === 'B2' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">B3 百分比管理</h3>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/admin/percentage-config')}
                  >
                    批量管理百分比
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {b3Data.map((item) => (
                    <Card key={item.value} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">{item.value}</h4>
                          <span className="text-sm font-semibold text-primary">{item.percentage}%</span>
                        </div>
                        
                        {item.count && item.totalCount && (
                          <div className="text-xs text-muted-foreground mb-3">
                            {item.count} / {item.totalCount} 次出現
                          </div>
                        )}
                        
                        <div className="w-full bg-muted rounded-full h-2 mb-3">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>

                        {/* Quick admin actions */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs"
                            onClick={() => navigate('/admin/percentage-config')}
                          >
                            編輯
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 顯示詳細文字資料 (如果有) */}
            {b3Details.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">詳細描述</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {b3Details.map((detail, index) => (
                    <Card key={index} className="p-3">
                      <p className="text-sm">{detail}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {b3Data.length === 0 && b3Details.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                找不到任何詳細資料
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 手機品牌對話框 */}
      <Dialog open={showPhoneBrands} onOpenChange={setShowPhoneBrands}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              手機品牌清單
            </DialogTitle>
            <DialogDescription>
              檢視手機品牌清單和百分比（管理員可編輯）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {phoneBrands.map((brand) => (
              <Card key={brand._id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{brand.name}</h4>
                    <p className="text-sm text-muted-foreground">{brand.percentage}%</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/percentage-config')}
                  >
                    管理
                  </Button>
                </div>
              </Card>
            ))}
            {phoneBrands.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                尚無手機品牌
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard; 