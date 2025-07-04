
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => onInputChange('is_active', checked)}
          />
          <Label htmlFor="is_active">Ativo *</Label>
          <p className="text-sm text-gray-500 ml-2">(Visível no frontend)</p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_published"
            checked={formData.is_published}
            onCheckedChange={(checked) => onInputChange('is_published', checked)}
          />
          <Label htmlFor="is_published">Publicado</Label>
          <p className="text-sm text-gray-500 ml-2">(Aparece na listagem pública)</p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => onInputChange('is_featured', checked)}
          />
          <Label htmlFor="is_featured">Em Destaque</Label>
          <p className="text-sm text-gray-500 ml-2">(Aparece na secção de destaques)</p>
        </div>

        <div>
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onInputChange('location', e.target.value)}
            placeholder="Ex: Lisboa, Portugal"
          />
        </div>

        <div>
          <Label htmlFor="contact_info">Informações de Contacto</Label>
          <Textarea
            id="contact_info"
            value={formData.contact_info}
            onChange={(e) => onInputChange('contact_info', e.target.value)}
            placeholder="Informações de contacto específicas para este veículo..."
            rows={3}
          />
        </div>
      </div>
    </TabsContent>
  );
};
