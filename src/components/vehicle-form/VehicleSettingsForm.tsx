
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import { VehicleFormData } from '@/hooks/useVehicleForm';

interface VehicleSettingsFormProps {
  formData: VehicleFormData;
  onInputChange: (field: keyof VehicleFormData, value: string | boolean) => void;
}

export const VehicleSettingsForm = ({ formData, onInputChange }: VehicleSettingsFormProps) => {
  return (
    <TabsContent value="settings" className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => onInputChange('is_active', checked)} />
          <Label htmlFor="is_active">Ativo</Label>
          <p className="text-sm text-muted-foreground ml-2">(Visível no frontend)</p>
        </div>

        <div>
          <Label htmlFor="location_country">País</Label>
          <Input id="location_country" value={formData.location_country} onChange={(e) => onInputChange('location_country', e.target.value)} placeholder="Ex: Portugal" />
        </div>

        <div>
          <Label htmlFor="location_city">Cidade</Label>
          <Input id="location_city" value={formData.location_city} onChange={(e) => onInputChange('location_city', e.target.value)} placeholder="Ex: Lisboa" />
        </div>

        <div>
          <Label htmlFor="stock_status">Estado de Stock</Label>
          <Input id="stock_status" value={formData.stock_status} onChange={(e) => onInputChange('stock_status', e.target.value)} placeholder="Ex: disponivel" />
        </div>
      </div>
    </TabsContent>
  );
};
