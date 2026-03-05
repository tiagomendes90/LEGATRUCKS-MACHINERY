
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { VehicleFormData } from '@/hooks/useVehicleForm';

interface VehicleSpecsFormProps {
  formData: VehicleFormData;
  onInputChange: (field: keyof VehicleFormData, value: string | boolean) => void;
}

export const VehicleSpecsForm = ({ formData, onInputChange }: VehicleSpecsFormProps) => {
  return (
    <TabsContent value="specs" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" value={formData.model} onChange={(e) => onInputChange('model', e.target.value)} placeholder="Ex: FH16 750" />
        </div>

        <div>
          <Label htmlFor="currency">Moeda</Label>
          <Input id="currency" value={formData.currency} onChange={(e) => onInputChange('currency', e.target.value)} placeholder="EUR" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Especificações adicionais podem ser geridas através das definições de specs por subcategoria.
      </p>
    </TabsContent>
  );
};
