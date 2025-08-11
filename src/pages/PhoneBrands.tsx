import React, { useState, useEffect } from 'react';
import { phoneBrandsAPI } from '../services/api';
import { PhoneBrand } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { 
  Plus,
  Trash2,
  Smartphone,
  Save,
  X,
  Edit,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EditingBrand {
  id: string;
  name: string;
  percentage: number;
}

const PhoneBrands: React.FC = () => {
  // Data states
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  const [editingBrand, setEditingBrand] = useState<EditingBrand | null>(null);
  
  // UI states
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', percentage: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPhoneBrands();
  }, []);

  const loadPhoneBrands = async () => {
    try {
      console.log('Loading phone brands...');
      const brands = await phoneBrandsAPI.getAll();
      console.log('Phone brands loaded:', brands);
      // Sort by name
      brands.sort((a, b) => a.name.localeCompare(b.name));
      setPhoneBrands(brands);
    } catch (error: any) {
      console.error('Failed to load phone brands:', error);
      toast.error('無法載入手機品牌清單');
    }
  };

  const addPhoneBrand = async () => {
    if (!newBrand.name.trim()) {
      toast.error('請輸入手機品牌名稱');
      return;
    }

    if (newBrand.percentage < 0 || newBrand.percentage > 100) {
      toast.error('百分比必須介於 0 到 100 之間');
      return;
    }

    try {
      setIsLoading(true);
      await phoneBrandsAPI.create(newBrand.name, newBrand.percentage);
      setNewBrand({ name: '', percentage: 0 });
      setShowAddBrand(false);
      loadPhoneBrands();
      toast.success('新增手機品牌成功！');
    } catch (error: any) {
      console.error('Add phone brand error:', error);
      toast.error('新增手機品牌失敗！');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (brand: PhoneBrand) => {
    setEditingBrand({
      id: brand._id!,
      name: brand.name,
      percentage: brand.percentage
    });
  };

  const cancelEditing = () => {
    setEditingBrand(null);
  };

  const saveEditing = async () => {
    if (!editingBrand) return;

    if (!editingBrand.name.trim()) {
      toast.error('請輸入手機品牌名稱');
      return;
    }

    if (editingBrand.percentage < 0 || editingBrand.percentage > 100) {
      toast.error('百分比必須介於 0 到 100 之間');
      return;
    }

    try {
      setIsLoading(true);
      await phoneBrandsAPI.update(editingBrand.id, editingBrand.name, editingBrand.percentage);
      setEditingBrand(null);
      loadPhoneBrands();
      toast.success('更新手機品牌成功！');
    } catch (error: any) {
      console.error('Update phone brand error:', error);
      toast.error('更新手機品牌失敗！');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoneBrand = async (brand: PhoneBrand) => {
    // Custom confirmation toast
    const confirmDelete = () => {
      return new Promise((resolve, reject) => {
        toast((t) => (
          <div className="flex flex-col gap-3 min-w-[300px]">
            <p className="font-medium">確認刪除手機品牌</p>
            <p className="text-sm text-gray-600">
              您確定要刪除品牌「<strong>{brand.name}</strong>」嗎？
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
      await confirmDelete();
      setIsLoading(true);
      await phoneBrandsAPI.delete(brand._id!);
      loadPhoneBrands();
      toast.success(`已成功刪除品牌「${brand.name}」！`);
    } catch (error: any) {
      if (error.message !== 'Cancelled') {
        console.error('Delete phone brand error:', error);
        toast.error('刪除手機品牌失敗！');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">管理手機品牌</h2>
          <p className="text-muted-foreground">新增、編輯、刪除手機品牌並設定當使用者選擇「手機案」時的百分比</p>
        </div>
        <Button onClick={() => setShowAddBrand(true)} className="gap-2" disabled={isLoading}>
          <Plus className="h-4 w-4" />
          新增品牌
        </Button>
      </div>

      {/* 表格檢視 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            手機品牌清單（{phoneBrands.length}）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phoneBrands.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      品牌名稱
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      百分比
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      顯示
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {phoneBrands.map((brand) => {
                    const isEditing = editingBrand?.id === brand._id;
                    
                    return (
                      <tr key={brand._id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          {isEditing ? (
                            <Input
                              value={editingBrand?.name || ''}
                              onChange={(e) => editingBrand && setEditingBrand({
                                ...editingBrand,
                                name: e.target.value
                              })}
                              className="w-full"
                              disabled={isLoading}
                            />
                          ) : (
                            <div className="font-medium">{brand.name}</div>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editingBrand?.percentage || 0}
                                onChange={(e) => editingBrand && setEditingBrand({
                                  ...editingBrand,
                                  percentage: Number(e.target.value)
                                })}
                                className="w-20"
                                disabled={isLoading}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-primary">{brand.percentage}</span>
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="w-32">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(isEditing ? (editingBrand?.percentage || 0) : brand.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  disabled={isLoading}
                                  className="gap-1"
                                >
                                  <X className="h-3 w-3" />
                                  取消
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={saveEditing}
                                  disabled={isLoading}
                                  className="gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  儲存
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(brand)}
                                  disabled={isLoading || !!editingBrand}
                                  className="gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  編輯
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deletePhoneBrand(brand)}
                                  disabled={isLoading || !!editingBrand}
                                  className="gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  刪除
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">尚無手機品牌</h3>
              <p className="text-muted-foreground mb-4">
                新增第一個手機品牌以開始。當使用者在步驟 B2 選擇「手機案」時，將顯示這些品牌。
              </p>
              <Button onClick={() => setShowAddBrand(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                新增品牌
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增手機品牌對話框 */}
      <Dialog open={showAddBrand} onOpenChange={setShowAddBrand}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              新增手機品牌
            </DialogTitle>
            <DialogDescription>
              輸入手機品牌資訊和百分比
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">品牌名稱</label>
              <Input
                value={newBrand.name}
                onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                placeholder="輸入手機品牌名稱"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">百分比（%）</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newBrand.percentage}
                onChange={(e) => setNewBrand({...newBrand, percentage: Number(e.target.value)})}
                placeholder="輸入百分比"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddBrand(false)}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button 
                onClick={addPhoneBrand}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    正在新增...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    新增品牌
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhoneBrands; 