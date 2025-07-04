
import React from 'react';
import { Button } from '@/components/ui/button';

interface VehicleFormNavigationProps {
  currentTab: string;
  isFirstTab: boolean;
  isLastTab: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  onPrevious: () => void;
  onCancel: () => void;
}

export const VehicleFormNavigation = ({
  currentTab,
  isFirstTab,
  isLastTab,
  isSubmitting,
  isUploading,
  onPrevious,
  onCancel
}: VehicleFormNavigationProps) => {
  return (
    <div className="flex justify-between pt-6 border-t">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onPrevious}
        disabled={isFirstTab}
      >
        Anterior
      </Button>
      
      <div className="flex space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? "A processar..." : 
           isLastTab ? "Adicionar Veículo" : "Próximo"}
        </Button>
      </div>
    </div>
  );
};
