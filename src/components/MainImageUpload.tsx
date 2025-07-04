
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage, getImageSizeKB } from '@/utils/imageCompression';

interface MainImageUploadProps {
  image: File | null;
  onImageChange: (image: File | null) => void;
}

export const MainImageUpload = ({ image, onImageChange }: MainImageUploadProps) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Aviso",
        description: "Apenas ficheiros de imagem são permitidos.",
        variant: "destructive",
      });
      return;
    }

    setIsCompressing(true);

    try {
      toast({
        title: "A processar imagem principal...",
        description: "Comprimindo imagem para WebP...",
      });

      const originalSize = getImageSizeKB(file);
      const compressedImage = await compressImage(file);
      const compressedSize = getImageSizeKB(compressedImage);
      const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

      onImageChange(compressedImage);

      toast({
        title: "Imagem principal processada!",
        description: `Comprimida com sucesso. Redução: ${reduction}%`,
      });
    } catch (error) {
      console.error('Error compressing main image:', error);
      toast({
        title: "Erro na compressão",
        description: "A imagem pode não ter sido comprimida corretamente.",
        variant: "destructive",
      });
      onImageChange(file);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  }, [onImageChange, toast]);

  const removeImage = useCallback(() => {
    onImageChange(null);
  }, [onImageChange]);

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const formatFileSize = (sizeInBytes: number): string => {
    const sizeKB = sizeInBytes / 1024;
    if (sizeKB < 1024) {
      return `${Math.round(sizeKB)} KB`;
    }
    return `${(sizeKB / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="main-image-upload"
          disabled={isCompressing}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('main-image-upload')?.click()}
          disabled={isCompressing}
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              A comprimir...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {image ? 'Alterar Imagem Principal' : 'Adicionar Imagem Principal'}
            </>
          )}
        </Button>
        {isCompressing && (
          <p className="text-sm text-gray-500">
            Comprimindo imagem para WebP (máx. 1MB)...
          </p>
        )}
      </div>

      {image ? (
        <Card className="relative max-w-md">
          <CardContent className="p-4">
            <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100">
              <img
                src={getImagePreview(image)}
                alt="Imagem Principal"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={removeImage}
                disabled={isCompressing}
              >
                <X className="h-4 w-4" />
              </Button>
              {image.type === 'image/webp' && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  WebP
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Principal
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 truncate">
                {image.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(image.size)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-gray-300 max-w-md">
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Imagem Principal</p>
            <p className="text-sm text-gray-400 mt-1">
              Esta será a imagem de destaque do veículo
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Será automaticamente comprimida para WebP (máx. 1MB, 1280px)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
