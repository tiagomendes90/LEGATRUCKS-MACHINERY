import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useImageKitUpload } from '@/hooks/useImageKitUpload';

interface MainImageUploadProps {
  image: File | null;
  onImageChange: (image: File | null) => void;
  uploadedImageUrl?: string | null;
  onUploadedImageChange?: (url: string | null) => void;
}

export const MainImageUpload = ({ 
  image, 
  onImageChange,
  uploadedImageUrl,
  onUploadedImageChange
}: MainImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { uploadSingleImage, isUploading } = useImageKitUpload();
  const { toast } = useToast();

  console.log('🖼️ MainImageUpload state:', {
    hasImage: !!image,
    uploadedImageUrl,
    previewUrl,
    isProcessing,
    isUploading
  });

  // Create preview URL when image changes
  useEffect(() => {
    if (image && !uploadedImageUrl) {
      const preview = URL.createObjectURL(image);
      setPreviewUrl(preview);
      
      return () => {
        URL.revokeObjectURL(preview);
      };
    } else if (uploadedImageUrl) {
      setPreviewUrl(null);
    }
  }, [image, uploadedImageUrl]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, file.size);

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Aviso",
        description: "Apenas ficheiros de imagem são permitidos.",
        variant: "destructive",
      });
      return;
    }

    // Set the file immediately for preview
    onImageChange(file);
    
    // Show processing message
    toast({
      title: "A processar imagem...",
      description: "A carregar e otimizar via ImageKit...",
    });

    setIsProcessing(true);

    try {
      // Upload to ImageKit
      const result = await uploadSingleImage(file, 'temp', true);
      
      console.log('✅ ImageKit upload result:', result);

      if (result && result.url) {
        // Update with uploaded URL
        if (onUploadedImageChange) {
          onUploadedImageChange(result.url);
        }
        
        toast({
          title: "Sucesso!",
          description: "Imagem carregada e otimizada com sucesso!",
        });
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar imagem. Tente novamente.",
        variant: "destructive",
      });
      
      // Keep the local file for fallback
    } finally {
      setIsProcessing(false);
    }

    e.target.value = '';
  }, [onImageChange, onUploadedImageChange, uploadSingleImage, toast]);

  const removeImage = useCallback(() => {
    onImageChange(null);
    if (onUploadedImageChange) {
      onUploadedImageChange(null);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [onImageChange, onUploadedImageChange, previewUrl]);

  const getImagePreview = (): string | null => {
    if (uploadedImageUrl) return uploadedImageUrl;
    if (previewUrl) return previewUrl;
    if (image) return URL.createObjectURL(image);
    return null;
  };

  const formatFileSize = (sizeInBytes: number): string => {
    const sizeKB = sizeInBytes / 1024;
    if (sizeKB < 1024) {
      return `${Math.round(sizeKB)} KB`;
    }
    return `${(sizeKB / 1024).toFixed(1)} MB`;
  };

  const currentPreview = getImagePreview();
  const isLoading = isUploading || isProcessing;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="main-image-upload"
          disabled={isLoading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('main-image-upload')?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isProcessing ? 'A otimizar...' : 'A carregar...'}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {currentPreview ? 'Alterar Imagem Principal' : 'Adicionar Imagem Principal'}
            </>
          )}
        </Button>
        {isLoading && (
          <p className="text-sm text-gray-500">
            {isProcessing ? 'Otimizando via ImageKit...' : 'A carregar...'}
          </p>
        )}
      </div>

      {currentPreview ? (
        <Card className="relative max-w-md">
          <CardContent className="p-4">
            <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100">
              <img
                src={currentPreview}
                alt="Imagem Principal"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ Image load error:', currentPreview);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={removeImage}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
              {uploadedImageUrl && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  ImageKit ✓
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Principal
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 truncate">
                {image?.name || 'Imagem otimizada'}
              </p>
              {image && (
                <p className="text-xs text-gray-500">
                  {formatFileSize(image.size)}
                </p>
              )}
              {uploadedImageUrl && (
                <p className="text-xs text-green-600">
                  ✓ Otimizada via ImageKit
                </p>
              )}
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
              Otimizada automaticamente via ImageKit (WebP, CDN global)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
