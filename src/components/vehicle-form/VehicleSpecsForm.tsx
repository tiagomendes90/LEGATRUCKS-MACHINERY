
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          <Label htmlFor="fuel_type">Combustível</Label>
          <Select value={formData.fuel_type} onValueChange={(value) => onInputChange('fuel_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o combustível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="petrol">Gasolina</SelectItem>
              <SelectItem value="electric">Elétrico</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
              <SelectItem value="gas">Gás</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="gearbox">Transmissão</Label>
          <Select value={formData.gearbox} onValueChange={(value) => onInputChange('gearbox', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a transmissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automática</SelectItem>
              <SelectItem value="semi-automatic">Semi-automática</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="power_ps">Potência (PS)</Label>
          <Input
            id="power_ps"
            type="number"
            value={formData.power_ps}
            onChange={(e) => onInputChange('power_ps', e.target.value)}
            placeholder="Ex: 500"
          />
        </div>

        <div>
          <Label htmlFor="drivetrain">Tração</Label>
          <Select value={formData.drivetrain} onValueChange={(value) => onInputChange('drivetrain', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a tração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4x2">4x2</SelectItem>
              <SelectItem value="4x4">4x4</SelectItem>
              <SelectItem value="6x2">6x2</SelectItem>
              <SelectItem value="6x4">6x4</SelectItem>
              <SelectItem value="8x4">8x4</SelectItem>
              <SelectItem value="8x6">8x6</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="axles">Número de Eixos</Label>
          <Input
            id="axles"
            type="number"
            value={formData.axles}
            onChange={(e) => onInputChange('axles', e.target.value)}
            placeholder="Ex: 2"
          />
        </div>

        <div>
          <Label htmlFor="weight_kg">Peso (kg)</Label>
          <Input
            id="weight_kg"
            type="number"
            value={formData.weight_kg}
            onChange={(e) => onInputChange('weight_kg', e.target.value)}
            placeholder="Ex: 40000"
          />
        </div>

        <div>
          <Label htmlFor="body_color">Cor</Label>
          <Input
            id="body_color"
            value={formData.body_color}
            onChange={(e) => onInputChange('body_color', e.target.value)}
            placeholder="Ex: Azul"
          />
        </div>
      </div>
    </TabsContent>
  );
};
