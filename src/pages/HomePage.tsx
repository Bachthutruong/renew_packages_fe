import React, { useState, useEffect } from 'react';
import { dataAPI, phoneBrandsAPI } from '../services/api';
import { DataWithPercentage, PhoneBrand } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { 
  ChevronRight,
  ArrowLeft,
  Search,
  Eye,
  Phone,
  Settings
} from 'lucide-react';

type Step = 'select-b1' | 'select-b2' | 'select-b3';

const HomePage: React.FC = () => {
  // Data states
  const [b1Values, setB1Values] = useState<string[]>([]);
  const [b2Data, setB2Data] = useState<DataWithPercentage[]>([]);
  const [b3Data, setB3Data] = useState<DataWithPercentage[]>([]);
  const [b3Details, setB3Details] = useState<string[]>([]);
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  
  // Navigation states
  const [currentStep, setCurrentStep] = useState<Step>('select-b1');
  const [selectedB1, setSelectedB1] = useState<string>('');
  const [selectedB2, setSelectedB2] = useState<string>('');
  const [selectedB3, setSelectedB3] = useState<string>('');
  
  // UI states
  const [searchB1, setSearchB1] = useState<string>('');
  const [showB3Details, setShowB3Details] = useState(false);
  const [showPhoneBrands, setShowPhoneBrands] = useState(false);
  const [b3DetailsSource, setB3DetailsSource] = useState<'B2' | 'B3'>('B3');

  const isPhoneCase = selectedB2 === '手機案';

  useEffect(() => {
    loadB1Values();
    loadPhoneBrands();
  }, []);

  const loadB1Values = async () => {
    try {
      const values = await dataAPI.getB1Values();
      values.sort((a, b) => a.localeCompare(b));
      setB1Values(values);
    } catch (error: any) {
      console.error('Failed to load B1 values:', error);
    }
  };

  const loadPhoneBrands = async () => {
    try {
      const brands = await phoneBrandsAPI.getAll();
      setPhoneBrands(brands);
    } catch (error: any) {
      console.error('Failed to load phone brands:', error);
    }
  };

  const loadB3Details = async () => {
    if (!selectedB1 || !selectedB2 || !selectedB3) return;
    
    try {
      const details = await dataAPI.getB3Details(selectedB1, selectedB2, selectedB3);
      setB3Details(details);
      setB3DetailsSource('B3');
      setShowB3Details(true);
    } catch (error: any) {
      console.error('Failed to load B3 details:', error);
    }
  };

  const loadB3DetailsForB2 = async () => {
    if (!selectedB1 || !selectedB2) return;
    
    try {
      const b3DataForCombo = await dataAPI.getB3Data(selectedB1, selectedB2);
      const allDetails: string[] = [];
      
      for (const b3Item of b3DataForCombo) {
        const details = await dataAPI.getB3Details(selectedB1, selectedB2, b3Item.value);
        allDetails.push(...details);
      }
      
      setB3Details(allDetails);
      setB3DetailsSource('B2');
      setShowB3Details(true);
    } catch (error: any) {
      console.error('Failed to load B3 details for B2:', error);
    }
  };

  const handleB1Select = async (value: string) => {
    setSelectedB1(value);
    setSelectedB2('');
    setSelectedB3('');
    setCurrentStep('select-b2');
    
    try {
      const data = await dataAPI.getB2Data(value);
      setB2Data(data);
    } catch (error: any) {
      console.error('Failed to load B2 data:', error);
    }
  };

  const handleB2Select = async (value: string) => {
    setSelectedB2(value);
    setSelectedB3('');
  };

  const handleMoveToB3 = async () => {
    if (!selectedB1 || !selectedB2) return;
    
    setCurrentStep('select-b3');
    
    try {
      const data = await dataAPI.getB3Data(selectedB1, selectedB2);
      setB3Data(data);
    } catch (error: any) {
      console.error('Failed to load B3 data:', error);
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

  const resetFlow = () => {
    setSelectedB1('');
    setSelectedB2('');
    setSelectedB3('');
    setCurrentStep('select-b1');
    setB2Data([]);
    setB3Data([]);
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
      <span className={currentStep === 'select-b1' ? 'text-foreground font-medium' : 'cursor-pointer hover:text-foreground'} 
            onClick={() => currentStep !== 'select-b1' && resetFlow()}>
        選擇 B1
      </span>
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
      <div>
        <h2 className="text-2xl font-bold mb-2">步驟 1：選擇 B1</h2>
        <p className="text-muted-foreground">選擇一個 B1 數值以開始資料篩選過程</p>
      </div>

      {/* 搜尋 */}
      <Card>
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
      </Card>

      {/* B1 數值 */}
      <Card>
        <CardHeader>
          <CardTitle>B1 數值清單（{filteredB1Values.length} 個結果）</CardTitle>
          <CardDescription>
            按照遞增順序排序
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          {filteredB1Values.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              找不到符合的 B1 數值
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
          <CardTitle>B2 數值清單（{b2Data.length} 個結果）</CardTitle>
          <CardDescription>
            基於在 B1：{selectedB1} 中出現頻率的百分比
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          {b2Data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              找不到任何 B2 數值
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
                繼續到 B3
              </Button>
              
              <Button onClick={loadB3DetailsForB2} variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                檢視 B3 詳細資料
              </Button>
              
              {isPhoneCase && (
                <Button onClick={openPhoneBrandsModal} variant="secondary" className="gap-2">
                  <Phone className="h-4 w-4" />
                  檢視手機品牌
                </Button>
              )}
              
              <Button onClick={resetFlow} variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                重新開始
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
          <CardTitle>B3 數值清單（{b3Data.length} 個結果）</CardTitle>
          <CardDescription>
            基於依據 B1：{selectedB1} 和 B2：{selectedB2} 篩選的出現頻率的百分比
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <Button onClick={loadB3Details} className="gap-2">
                      <Eye className="h-4 w-4" />
                      檢視 B3 詳細資料
                    </Button>
                    {isPhoneCase && (
                      <Button onClick={openPhoneBrandsModal} variant="secondary" className="gap-2">
                        <Phone className="h-4 w-4" />
                        檢視手機品牌
                      </Button>
                    )}
                    <Button onClick={resetFlow} variant="outline" className="gap-2">
                      <Settings className="h-4 w-4" />
                      重新開始
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {b3Data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              找不到任何 B3 數值
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderBreadcrumb()}
      
      {currentStep === 'select-b1' && renderSelectB1Screen()}
      {currentStep === 'select-b2' && renderSelectB2Screen()}
      {currentStep === 'select-b3' && renderSelectB3Screen()}

      {/* B3 詳細資料對話框 */}
      <Dialog open={showB3Details} onOpenChange={setShowB3Details}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                ? `所選 B3 的詳細資料清單`
                : `所選 B1 和 B2 組合的所有 B3 詳細資料清單`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {b3Details.map((detail, index) => (
              <Card key={index} className="p-4">
                <p className="text-sm">{detail}</p>
              </Card>
            ))}
            {b3Details.length === 0 && (
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