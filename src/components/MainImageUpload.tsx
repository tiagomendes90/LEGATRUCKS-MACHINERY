import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    if (image && !uploadedImageUrl) {
      const preview = URL.createObjectURL(image);
      setPreviewUrl(preview);
      return () => URL.revokeObjectURL(preview);
    } else if (uploadedImageUrl) {
      setPreviewUrl(null);
    }
  }, [image, uploadedImageUrl]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

    onImageChange(file);
    // Clear any previously uploaded URL since we have a new file
    if (onUploadedImageChange) {
      onUploadedImageChange(null);
    }

    e.target.value = '';
  }, [onImageChange, onUploadedImageChange, toast]);

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
    if (sizeKB < 1024) return `${Math.round(sizeKB)} KB`;
    return `${(sizeKB / 1024).toFixed(1)} MB`;
  };

  const currentPreview = getImagePreview();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="main-image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('main-image-upload')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentPreview ? 'Alterar Imagem Principal' : 'Adicionar Imagem Principal'}
        </Button>
      </div>

      {currentPreview ? (
        <Card className="relative max-w-md">
          <CardContent className="p-4">
            <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
              <img
                src={currentPreview}
                alt="Imagem Principal"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Principal
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium truncate">
                {image?.name || 'Imagem carregada'}
              </p>
              {image && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(image.size)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-muted-foreground/25 max-w-md">
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Imagem Principal</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Esta será a imagem de destaque do veículo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
