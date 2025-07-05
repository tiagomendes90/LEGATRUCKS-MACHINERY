
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ImageKitUploadedImage {
  url: string;
  thumbnailUrl: string;
  fileId: string;
  size: number;
  width: number;
  height: number;
  sort_order: number;
}

export const useImageKitUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadImages = async (files: File[], vehicleId: string): Promise<ImageKitUploadedImage[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    const uploadedImages: ImageKitUploadedImage[] = [];

    try {
      console.log(`🚀 Starting ImageKit upload for ${files.length} files`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isMainImage = i === 0;
        
        console.log(`📤 Uploading ${file.name} (${isMainImage ? 'main' : 'secondary'} image)`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('vehicleId', vehicleId);
        formData.append('isMainImage', isMainImage.toString());
        formData.append('sortOrder', i.toString());

        const { data, error } = await supabase.functions.invoke('imagekit-upload', {
          body: formData,
        });

        if (error) {
          console.error('ImageKit upload error:', error);
          throw new Error(`Upload failed: ${error.message}`);
        }

        if (!data) {
          throw new Error('No response data from upload function');
        }

        if (!data.success) {
          console.error('ImageKit upload failed:', data.error);
          throw new Error(data.error || 'Upload failed without specific error');
        }

        console.log(`✅ ${file.name} uploaded successfully`);

        uploadedImages.push({
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          fileId: data.fileId,
          size: data.size,
          width: data.width,
          height: data.height,
          sort_order: i
        });
      }

      toast({
        title: "Sucesso",
        description: `${files.length} imagem(ns) carregada(s) e otimizada(s) com sucesso!`,
      });

      return uploadedImages;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      
      // Check if it's a configuration error
      if (error.message?.includes('ImageKit not configured')) {
        toast({
          title: "Configuração Necessária",
          description: "ImageKit não está configurado. Configure as chaves API nas definições do projeto.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: `Falha ao carregar imagens: ${error.message}`,
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadSingleImage = async (file: File, vehicleId?: string, isMainImage = false): Promise<ImageKitUploadedImage> => {
    const result = await uploadImages([file], vehicleId || 'temp');
    return result[0];
  };

  return {
    uploadImages,
    uploadSingleImage,
    isUploading
  };
};
