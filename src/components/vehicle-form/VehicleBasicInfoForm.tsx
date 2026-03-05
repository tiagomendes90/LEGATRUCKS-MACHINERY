
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { VehicleFormData } from '@/hooks/useVehicleForm';

interface VehicleBasicInfoFormProps {
  formData: VehicleFormData;
  selectedCategoryId: string;
  categories: any[];
  availableSubcategories: any[];
  availableBrands: any[];
  distanceField: any;
  onInputChange: (field: keyof VehicleFormData, value: string | boolean) => void;
  onCategoryChange: (categoryId: string) => void;
}

export const VehicleBasicInfoForm = ({
  formData, selectedCategoryId, categories, availableSubcategories, availableBrands,
  distanceField, onInputChange, onCategoryChange
}: VehicleBasicInfoFormProps) => {
  return (
    <TabsContent value="basic" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="title">Nome/Modelo *</Label>
          <Input id="title" value={formData.title} onChange={(e) => onInputChange('title', e.target.value)} placeholder="Ex: Volvo FH16 750 Globetrotter" required />
        </div>

        <div>
          <Label htmlFor="category">Categoria *</Label>
          <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
            <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
            <SelectContent>
              {categories?.length > 0 ? categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              )) : <SelectItem value="loading" disabled>A carregar...</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subcategory_id">Subcategoria *</Label>
          <Select value={formData.subcategory_id} onValueChange={(v) => onInputChange('subcategory_id', v)} disabled={!selectedCategoryId}>
            <SelectTrigger><SelectValue placeholder="Selecione a subcategoria" /></SelectTrigger>
            <SelectContent>
              {availableSubcategories?.length > 0 ? availableSubcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
              )) : <SelectItem value="none" disabled>Selecione uma categoria primeiro</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="brand_id">Marca *</Label>
          <Select value={formData.brand_id} onValueChange={(v) => onInputChange('brand_id', v)} disabled={!selectedCategoryId}>
            <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
            <SelectContent>
              {availableBrands?.length > 0 ? availableBrands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
              )) : <SelectItem value="none" disabled>A carregar marcas...</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" value={formData.model} onChange={(e) => onInputChange('model', e.target.value)} placeholder="Ex: FH16 750" />
        </div>

        <div>
          <Label htmlFor="year">Ano *</Label>
          <Input id="year" type="number" value={formData.year} onChange={(e) => onInputChange('year', e.target.value)} placeholder="Ex: 2020" min="1990" max={new Date().getFullYear() + 1} required />
        </div>

        <div>
          <Label htmlFor="condition">Estado *</Label>
          <Select value={formData.condition} onValueChange={(v) => onInputChange('condition', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="used">Usado</SelectItem>
              <SelectItem value="restored">Restaurado</SelectItem>
              <SelectItem value="modified">Modificado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price">Preço (EUR) *</Label>
          <Input id="price" type="text" value={formData.price}
            onChange={(e) => { const v = e.target.value.replace(/[^\d.,]/g, ''); onInputChange('price', v); }}
            placeholder="Ex: 45000" required />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => onInputChange('description', e.target.value)} placeholder="Descreva as características..." rows={4} />
      </div>
    </TabsContent>
  );
};
