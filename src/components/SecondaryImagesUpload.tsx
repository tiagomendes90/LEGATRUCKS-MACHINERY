
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecondaryImagesUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  uploadedImages?: Array<{ url: string; file?: File }>;
  onUploadedImagesChange?: (images: Array<{ url: string; file?: File }>) => void;
  maxImages?: number;
}

export const SecondaryImagesUpload = ({ 
  images, 
  onImagesChange, 
  uploadedImages = [],
  onUploadedImagesChange,
  maxImages = 20 
}: SecondaryImagesUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Aviso",
        description: "Apenas ficheiros de imagem são permitidos.",
        variant: "destructive",
      });
    }

    const totalImages = images.length + uploadedImages.length + imageFiles.length;
    if (totalImages > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxImages} imagens secundárias permitidas.`,
        variant: "destructive",
      });
      return;
    }

    if (imageFiles.length === 0) return;

    setIsProcessing(true);

    try {
      toast({
        title: "A processar imagens secundárias...",
        description: `${imageFiles.length} imagem(ns) serão otimizadas via ImageKit...`,
      });

      // Add files to state for immediate preview
      onImagesChange([...images, ...imageFiles]);

      toast({
        title: "Imagens adicionadas!",
        description: `${imageFiles.length} imagem(ns) prontas para upload otimizado.`,
      });
    } catch (error) {
      console.error('Error processing secondary images:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar imagens.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  }, [images, uploadedImages.length, onImagesChange, maxImages, toast]);

  const removeImage = useCallback((index: number, isUploaded = false) => {
    if (isUploaded && onUploadedImagesChange) {
      const newUploadedImages = uploadedImages.filter((_, i) => i !== index);
      onUploadedImagesChange(newUploadedImages);
    } else {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    }
  }, [images, uploadedImages, onImagesChange, onUploadedImagesChange]);

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

  const totalImages = images.length + uploadedImages.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="secondary-images-upload"
          disabled={isProcessing}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('secondary-images-upload')?.click()}
          disabled={isProcessing || totalImages >= maxImages}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              A processar...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Imagens de Detalhe ({totalImages}/{maxImages})
            </>
          )}
        </Button>
        {isProcessing && (
          <p className="text-sm text-gray-500">
            Preparando para otimização via ImageKit...
          </p>
        )}
      </div>

      {totalImages > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Uploaded images */}
          {uploadedImages.map((uploadedImage, index) => (
            <Card key={`uploaded-${index}`} className="relative">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={uploadedImage.url}
                    alt={`Imagem otimizada ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(index, true)}
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                    ImageKit
                  </div>
                  <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                    {index + 1}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 truncate">
                    Imagem otimizada
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pending images */}
          {images.map((file, index) => (
            <Card key={`pending-${index}`} className="relative">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={getImagePreview(file)}
                    alt={`Imagem de detalhe ${uploadedImages.length + index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(index, false)}
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
                    Pendente
                  </div>
                  <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                    {uploadedImages.length + index + 1}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalImages === 0 && !isProcessing && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Imagens de Detalhe</p>
            <p className="text-sm text-gray-400 mt-1">
              Galeria de imagens do veículo (máx. {maxImages})
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Otimizadas automaticamente via ImageKit (WebP, CDN global)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
