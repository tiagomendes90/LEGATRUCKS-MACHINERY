
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
  formData,
  selectedCategoryId,
  categories,
  availableSubcategories,
  availableBrands,
  distanceField,
  onInputChange,
  onCategoryChange
}: VehicleBasicInfoFormProps) => {
  
  console.log('🔍 VehicleBasicInfoForm Debug:');
  console.log('📂 Selected Category ID:', selectedCategoryId);
  console.log('📂 Categories:', categories?.length || 0);
  console.log('🏷️ Available Brands Count:', availableBrands?.length || 0);
  console.log('🏷️ Available Brands:', availableBrands?.map(b => b.name) || []);
  console.log('🔧 Distance Field:', distanceField);

  return (
    <TabsContent value="basic" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="title">Nome/Modelo *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Ex: Volvo FH16 750 Globetrotter"
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Categoria *</Label>
          <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-categories" disabled>
                  Nenhuma categoria disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subcategory_id">Subcategoria *</Label>
          <Select 
            value={formData.subcategory_id} 
            onValueChange={(value) => onInputChange('subcategory_id', value)}
            disabled={!selectedCategoryId || availableSubcategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a subcategoria" />
            </SelectTrigger>
            <SelectContent>
              {availableSubcategories && availableSubcategories.length > 0 ? (
                availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-subcategories" disabled>
                  {selectedCategoryId ? "Nenhuma subcategoria disponível" : "Selecione uma categoria primeiro"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="brand_id">Marca *</Label>
          <Select 
            value={formData.brand_id} 
            onValueChange={(value) => onInputChange('brand_id', value)}
            disabled={!selectedCategoryId || availableBrands.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a marca" />
            </SelectTrigger>
            <SelectContent>
              {availableBrands && availableBrands.length > 0 ? (
                availableBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-brands" disabled>
                  {selectedCategoryId ? "A carregar marcas..." : "Selecione uma categoria primeiro"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {selectedCategoryId && availableBrands.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Nenhuma marca disponível para esta categoria. Verifique se as marcas têm a categoria "{categories.find(c => c.id === selectedCategoryId)?.name}" configurada.
            </p>
          )}
        </div>

        {distanceField && (
          <div>
            <Label htmlFor={distanceField.field}>{distanceField.label} *</Label>
            <Input
              id={distanceField.field}
              type="number"
              value={formData[distanceField.field as keyof VehicleFormData] as string}
              onChange={(e) => onInputChange(distanceField.field, e.target.value)}
              placeholder={distanceField.placeholder}
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="registration_year">Ano *</Label>
          <Input
            id="registration_year"
            type="number"
            value={formData.registration_year}
            onChange={(e) => onInputChange('registration_year', e.target.value)}
            placeholder="Ex: 2020"
            min="1990"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>

        <div>
          <Label htmlFor="condition">Estado *</Label>
          <Select value={formData.condition} onValueChange={(value) => onInputChange('condition', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="used">Usado</SelectItem>
              <SelectItem value="restored">Restaurado</SelectItem>
              <SelectItem value="modified">Modificado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price_eur">Preço (EUR) *</Label>
          <Input
            id="price_eur"
            type="text"
            value={formData.price_eur}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d.,]/g, '');
              onInputChange('price_eur', value);
            }}
            placeholder="Ex: 45000 ou 45.000"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Descreva as características e estado do veículo..."
          rows={4}
        />
      </div>
    </TabsContent>
  );
};
