
import React from 'react';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { MainImageUpload } from '@/components/MainImageUpload';
import { SecondaryImagesUpload } from '@/components/SecondaryImagesUpload';

interface VehicleImagesFormProps {
  mainImage: File | null;
  secondaryImages: File[];
  onMainImageChange: (image: File | null) => void;
  onSecondaryImagesChange: (images: File[]) => void;
}

export const VehicleImagesForm = ({
  mainImage,
  secondaryImages,
  onMainImageChange,
  onSecondaryImagesChange
}: VehicleImagesFormProps) => {
  return (
    <TabsContent value="images" className="space-y-4">
      <div>
        <Label>Imagem Principal *</Label>
        <p className="text-sm text-gray-500 mb-2">
          Esta será a imagem de destaque na listagem e página do veículo. Otimizada automaticamente via ImageKit (WebP, CDN)
        </p>
        <MainImageUpload
          image={mainImage}
          onImageChange={onMainImageChange}
        />
      </div>

      <div>
        <Label>Imagens de Detalhe</Label>
        <p className="text-sm text-gray-500 mb-2">
          Galeria de imagens do veículo (máx. 20). Otimizadas automaticamente via ImageKit
        </p>
        <SecondaryImagesUpload
          images={secondaryImages}
          onImagesChange={onSecondaryImagesChange}
        />
      </div>
    </TabsContent>
  );
};
