
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedImage {
  url: string;
  sort_order: number;
}

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadImages = async (files: File[], vehicleId: string): Promise<UploadedImage[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    const uploadedImages: UploadedImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const isMainImage = i === 0; // First image is considered the main image
        const fileName = `${vehicleId}/${isMainImage ? 'main' : `secondary-${i}`}-${Date.now()}.${fileExt}`;
        
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName);

        // Insert into vehicle_images table
        const { error: dbError } = await supabase
          .from('vehicle_images')
          .insert({
            vehicle_id: vehicleId,
            image_url: publicUrl,
            sort_order: i
          });

        if (dbError) {
          console.error('Error inserting image record:', dbError);
          throw dbError;
        }

        // Update main_image_url in vehicles table if this is the main image
        if (isMainImage) {
          const { error: vehicleUpdateError } = await supabase
            .from('vehicles')
            .update({ main_image_url: publicUrl })
            .eq('id', vehicleId);

          if (vehicleUpdateError) {
            console.error('Error updating vehicle main image:', vehicleUpdateError);
            // Don't throw here as the image was still uploaded successfully
          }
        }

        uploadedImages.push({
          url: publicUrl,
          sort_order: i
        });
      }

      toast({
        title: "Sucesso",
        description: `${files.length} imagem(ns) carregada(s) com sucesso!`,
      });

      return uploadedImages;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar imagens. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImages,
    isUploading
  };
};
