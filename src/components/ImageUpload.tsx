
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressMultipleImages, getImageSizeKB } from '@/utils/imageCompression';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) => {
  const [isCompressing, setIsCompressing] = useState(false);
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

    const totalImages = images.length + imageFiles.length;
    if (totalImages > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxImages} imagens permitidas.`,
        variant: "destructive",
      });
      return;
    }

    if (imageFiles.length === 0) return;

    setIsCompressing(true);

    try {
      // Show compression start toast
      toast({
        title: "A processar imagens...",
        description: `Comprimindo ${imageFiles.length} imagem(ns) para WebP...`,
      });

      // Compress images automatically
      const compressedImages = await compressMultipleImages(imageFiles);
      
      // Calculate total size reduction
      const originalSize = imageFiles.reduce((sum, file) => sum + getImageSizeKB(file), 0);
      const compressedSize = compressedImages.reduce((sum, file) => sum + getImageSizeKB(file), 0);
      const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

      onImagesChange([...images, ...compressedImages]);

      toast({
        title: "Imagens processadas!",
        description: `${compressedImages.length} imagem(ns) comprimida(s). Redução: ${reduction}%`,
      });
    } catch (error) {
      console.error('Error compressing images:', error);
      toast({
        title: "Erro na compressão",
        description: "Algumas imagens podem não ter sido comprimidas corretamente.",
        variant: "destructive",
      });
      // Fallback to original images
      onImagesChange([...images, ...imageFiles]);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  }, [images, onImagesChange, maxImages, toast]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

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
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
          disabled={isCompressing}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={isCompressing || images.length >= maxImages}
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              A comprimir...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Imagens ({images.length}/{maxImages})
            </>
          )}
        </Button>
        {isCompressing && (
          <p className="text-sm text-gray-500">
            Comprimindo imagens para WebP (máx. 1MB)...
          </p>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={getImagePreview(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                    disabled={isCompressing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {file.type === 'image/webp' && (
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                      WebP
                    </div>
                  )}
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

      {images.length === 0 && !isCompressing && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma imagem selecionada</p>
            <p className="text-sm text-gray-400 mt-1">
              Clique em "Adicionar Imagens" para começar
            </p>
            <p className="text-xs text-gray-400 mt-2">
              As imagens serão automaticamente comprimidas para WebP (máx. 1MB, 1280px)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
