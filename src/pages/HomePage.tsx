import React, { useState, useEffect } from 'react';
import { dataAPI, phoneBrandsAPI } from '../services/api';
import { DataWithPercentage, PhoneBrand, GroupedB3Detail } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
// import { Input } from '../components/ui/input';
import { 
  ChevronRight,
  // ArrowLeft,
  // Search,
  Eye,
  Phone,
  Settings,
  Smartphone
} from 'lucide-react';

// type Step = 'select-b1' | 'select-b2' | 'select-b3';

const HomePage: React.FC = () => {
  // Data states
  const [b1Values, setB1Values] = useState<string[]>([]);
  const [b2Data, setB2Data] = useState<DataWithPercentage[]>([]);
  const [b3Data, setB3Data] = useState<DataWithPercentage[]>([]);
  const [b3Details, setB3Details] = useState<GroupedB3Detail[]>([]);
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  
  // Navigation states - removed currentStep, using individual states
  const [selectedB1, setSelectedB1] = useState<string>('');
  const [selectedB2, setSelectedB2] = useState<string>('');
  const [selectedB3, setSelectedB3] = useState<string>('');
  
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
      
      console.log('[HomePage] Sorted B1 values:', sortedValues);
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
      console.log('[HomePage] Loading B3 details for:', { selectedB1, selectedB2, selectedB3 });
      
      // Clear API cache to force fresh data
      const cacheKey = `b3Details:${selectedB1}:${selectedB2}:${selectedB3}`;
      console.log('[HomePage] Clearing API cache for:', cacheKey);
      // Access apiCache from services to clear
      
      const details = await dataAPI.getB3Details(selectedB1, selectedB2, selectedB3);
      console.log('[HomePage] Received B3 details:', details);
      console.log('[HomePage] Details type:', typeof details);
      console.log('[HomePage] Is array:', Array.isArray(details));
      console.log('[HomePage] Sample item type:', typeof details[0]);
      console.log('[HomePage] Sample item:', details[0]);
      
      // Check if we got old format (string array) vs new format (object array)
      if (Array.isArray(details) && details.length > 0) {
        const firstItem = details[0];
        if (typeof firstItem === 'string') {
          console.error('[HomePage] ❌ Received old format (string array) instead of new format (object array)');
          console.error('[HomePage] This indicates backend is returning cached old data or wrong endpoint');
          
          // Convert old format to new format temporarily
          const stringArray = details as unknown as string[];
          const convertedDetails = stringArray.map((detailStr: string) => ({
            detail: detailStr,
            count: 1,
            totalCount: details.length,
            percentage: Math.round((1 / details.length) * 100 * 100) / 100,
            configuredPercentage: undefined
          }));
          
          console.log('[HomePage] Converted to new format:', convertedDetails.slice(0, 3));
          setB3Details(convertedDetails);
        } else if (typeof firstItem === 'object' && firstItem.detail) {
          console.log('[HomePage] ✅ Received correct new format (object array)');
          setB3Details(details);
        } else {
          console.error('[HomePage] ❌ Received unknown format:', firstItem);
          setB3Details([]);
        }
      } else {
        console.log('[HomePage] Empty or invalid details array');
        setB3Details([]);
      }
      
      setB3DetailsSource('B3');
      setShowB3Details(true);
    } catch (error: any) {
      console.error('Failed to load B3 details:', error);
      setB3Details([]); // Set empty array on error
    } finally {
      setIsLoadingB3Details(false);
    }
  };

  const loadB3DetailsForB2 = async () => {
    if (!selectedB1 || !selectedB2) return;
    
    setIsLoadingB3Details(true);
    try {
      const b3DataForCombo = await dataAPI.getB3Data(selectedB1, selectedB2);
      const allDetails: GroupedB3Detail[] = [];
      
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
    
    // Show loading immediately and clear previous data
    setIsLoadingB2(true);
    setB2Data([]);
    
    try {
      console.log(`[HomePage] Loading B2 data for B1: ${value}`);
      const data = await dataAPI.getB2Data(value);
      console.log(`[HomePage] Loaded ${data.length} B2 items for B1: ${value}`);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      setB2Data(sortedData);
    } catch (error: any) {
      console.error('Failed to load B2 data:', error);
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
      console.log(`[HomePage] Loading B3 data for B1: ${selectedB1}, B2: ${value}`);
      const data = await dataAPI.getB3Data(selectedB1, value);
      console.log(`[HomePage] Loaded ${data.length} B3 items for B1: ${selectedB1}, B2: ${value}`);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      setB3Data(sortedData);
    } catch (error: any) {
      console.error('Failed to load B3 data:', error);
    } finally {
      setIsLoadingB3(false);
    }
  };

  const handleMoveToB3 = async () => {
    if (!selectedB1 || !selectedB2) return;
    
    // Expand B3 section
    setIsB3Expanded(true);
    
    // Show loading immediately and clear previous data
    setIsLoadingB3(true);
    setB3Data([]);
    
    try {
      console.log(`[HomePage] Loading B3 data for B1: ${selectedB1}, B2: ${selectedB2}`);
      const data = await dataAPI.getB3Data(selectedB1, selectedB2);
      console.log(`[HomePage] Loaded ${data.length} B3 items for B1: ${selectedB1}, B2: ${selectedB2}`);
      
      // Sort by percentage descending (highest first)
      const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
      setB3Data(sortedData);
    } catch (error: any) {
      console.error('Failed to load B3 data:', error);
    } finally {
      setIsLoadingB3(false);
    }
  };

  const handleB3Select = (value: string) => {
    setSelectedB3(value);
  };

  // const goBack = () => {
  //   // Reset to appropriate state
  //   if (selectedB3) {
  //     setSelectedB3('');
  //     setIsB3Expanded(false);
  //     setIsB2Expanded(true);
  //   } else if (selectedB2) {
  //     setSelectedB2('');
  //     setIsB2Expanded(false);
  //     setIsB1Expanded(true);
  //   }
  // };

  const resetFlow = () => {
    setSelectedB1('');
    setSelectedB2('');
    setSelectedB3('');
    setB2Data([]);
    setB3Data([]);
    setSearchB1('');
    setIsB1Expanded(true);
    setIsB2Expanded(false);
    setIsB3Expanded(false);
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

  // const renderBreadcrumb = () => (
  //   <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
  //     {/* <span className={currentStep === 'select-b1' ? 'text-foreground font-medium' : 'cursor-pointer hover:text-foreground'} 
  //           onClick={() => currentStep !== 'select-b1' && resetFlow()}>
  //       選擇 B1
  //     </span> */}
  //     {selectedB1 && (
  //       <>
  //         <span className="text-primary font-medium">{selectedB1}</span>
  //         {selectedB2 && (
  //           <>
  //             <ChevronRight className="h-4 w-4" />
  //             <span className="text-primary font-medium">{selectedB2}</span>
  //             {selectedB3 && (
  //               <>
  //                 <ChevronRight className="h-4 w-4" />
  //                 <span className="text-primary font-medium">{selectedB3}</span>
  //               </>
  //             )}
  //           </>
  //         )}
  //       </>
  //     )}
  //   </div>
  // );

  const renderSelectB1Screen = () => (
    <div className="space-y-4">
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
              variant={selectedB1 === value ? "default" : "outline"}
              onClick={() => handleB1Select(value)}
              className="h-auto p-4 text-left justify-start hover:bg-primary hover:text-primary-foreground"
            >
              <div className="truncate">{value}</div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  const renderSelectB2Screen = () => (
    <div className="space-y-4">
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

      {/* B2 選擇後的操作按鈕 */}
      {selectedB2 && (
        <div className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleMoveToB3} className="gap-2">
              <ChevronRight className="h-4 w-4" />
              續約划算的資費
            </Button>
            
            <Button onClick={loadB3DetailsForB2} variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              續約划算的專案資料
            </Button>
            
            {isPhoneCase && (
              <Button onClick={openPhoneBrandsModal} variant="secondary" className="gap-2">
                <Phone className="h-4 w-4" />
                檢視手機品牌
              </Button>
            )}
            
            <Button onClick={resetFlow} variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              重新分析
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSelectB3Screen = () => (
    <div className="space-y-4">
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
        <div className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={loadB3Details}
              variant="outline"
              className="flex-1 gap-2"
              disabled={isLoadingB3Details}
            >
              {isLoadingB3Details ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Eye className="h-4 w-4" />
              )}
              查看續約最划算的方案
            </Button>
            
            {/* <Button
              onClick={loadB3DetailsForB2}
              variant="outline"
              className="flex-1 gap-2"
              disabled={isLoadingB3Details}
            >
              {isLoadingB3Details ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Eye className="h-4 w-4" />
              )}
              查看所有 B2 的詳細資料
            </Button> */}
            
            {isPhoneCase && (
              <Button
                onClick={openPhoneBrandsModal}
                variant="outline"
                className="flex-1 gap-2"
                disabled={isLoadingPhoneBrands}
              >
                {isLoadingPhoneBrands ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
                查看手機品牌
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* {renderBreadcrumb()} */}
      
      {/* B1 Selection Section */}
      <Card className={`transition-all duration-300 ${selectedB1 ? 'bg-green-50 border-green-200' : ''}`}>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setIsB1Expanded(!isB1Expanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                選您目前的資費
                {selectedB1 && <span className="text-green-600">✓ {selectedB1}</span>}
              </CardTitle>
              {/* <CardDescription>選擇一個 B1 數值以開始資料篩選過程</CardDescription> */}
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
                  續約選手機案比較划算，您要手機案嗎？
                  {selectedB2 && <span className="text-green-600">✓ {selectedB2}</span>}
                </CardTitle>
                {/* <CardDescription>
                  基於 {selectedB1} 的選項
                </CardDescription> */}
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
                  選擇 B3
                  {selectedB3 && <span className="text-green-600">✓ {selectedB3}</span>}
                </CardTitle>
                {/* <CardDescription>
                  基於 {selectedB1} → {selectedB2} 的選項
                </CardDescription> */}
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {b3DetailsSource === 'B3' 
                ? `B3 詳細資料：${selectedB3}` 
                : `B1：${selectedB1}、B2：${selectedB2} 的 B3 詳細資料`
              }
            </DialogTitle>
            <DialogDescription>
              {b3DetailsSource === 'B3'
                ? `所選 B3 的詳細資料清單及百分比`
                : `所選 B1 和 B2 組合的所有 B3 詳細資料清單及百分比`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
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
                      
                      <div className="w-full bg-muted rounded-full h-3 mb-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Loading state */}
            {isLoadingB3Details && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted-foreground">正在載入詳細資料...</p>
                </div>
              </div>
            )}

            {/* 顯示詳細文字資料 (如果有) */}
            {!isLoadingB3Details && b3Details.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">詳細描述統計</h3>
                  <div className="text-sm text-muted-foreground">
                    共 {b3Details.length} 項資料
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {b3Details.map((item, index) => {
                    // Safe access with default values
                    const safeItem = {
                      detail: item?.detail || '無詳細資料',
                      count: item?.count || 0,
                      totalCount: item?.totalCount || 0,
                      percentage: typeof item?.percentage === 'number' ? item.percentage : 0,
                      configuredPercentage: typeof item?.configuredPercentage === 'number' ? item.configuredPercentage : undefined
                    };

                    return (
                      <Card key={`detail-${index}`} className="border hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* 主要內容 */}
                            <div className="min-h-[40px]">
                              <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                                {safeItem.detail}
                              </p>
                            </div>
                            
                            {/* 統計資訊 */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  出現: {safeItem.count}次
                                </span>
                                <span>總數: {safeItem.totalCount}</span>
                              </div>
                              <div className="text-sm font-semibold text-primary">
                                {safeItem.percentage.toFixed(1)}%
                              </div>
                            </div>
                            
                            {/* 設定比例顯示 */}
                            {safeItem.configuredPercentage !== undefined && (
                              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                管理員設定: {safeItem.configuredPercentage.toFixed(1)}%
                              </div>
                            )}
                            
                            {/* 進度條 */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>比例分布</span>
                                <span>{safeItem.percentage.toFixed(1)}% / 100%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(Math.max(safeItem.percentage, 0), 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* 統計摘要 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">統計摘要:</span>
                    <div className="flex gap-4">
                      <span>總項目: {b3Details.length}</span>
                      <span>總出現次數: {b3Details.reduce((sum, item) => sum + (item?.count || 0), 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingB3Details && b3Data.length === 0 && b3Details.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">找不到任何詳細資料</p>
                    <p className="text-sm">請嘗試選擇其他選項或聯繫管理員</p>
                  </div>
                </div>
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
              檢視手機品牌清單和百分比
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

export default HomePage;