
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressExistingImages } from '@/utils/imageCompression';

export const useCompressTruckImages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      console.log('Starting bulk image compression...');
      
      // Fetch all trucks with images
      const { data: trucks, error } = await supabase
        .from('trucks')
        .select('id, images')
        .not('images', 'is', null);

      if (error) throw error;

      if (!trucks || trucks.length === 0) {
        throw new Error('No trucks found with images');
      }

      let processedCount = 0;
      const totalTrucks = trucks.length;

      // Process trucks in batches
      for (const truck of trucks) {
        if (truck.images && truck.images.length > 0) {
          try {
            console.log(`Processing truck ${truck.id}...`);
            
            // Compress all images for this truck
            const compressedImages = await compressExistingImages(truck.images);
            
            // Update the truck with compressed images
            const { error: updateError } = await supabase
              .from('trucks')
              .update({ images: compressedImages })
              .eq('id', truck.id);

            if (updateError) {
              console.error(`Failed to update truck ${truck.id}:`, updateError);
            } else {
              processedCount++;
              console.log(`Successfully compressed images for truck ${truck.id} (${processedCount}/${totalTrucks})`);
            }
          } catch (error) {
            console.error(`Failed to process truck ${truck.id}:`, error);
          }
        }
      }

      return {
        totalTrucks,
        processedCount,
        message: `Successfully compressed images for ${processedCount} out of ${totalTrucks} trucks`
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['featured-trucks'] });
      
      toast({
        title: "Compressão Concluída",
        description: result.message,
      });
    },
    onError: (error: any) => {
      console.error('Failed to compress images:', error);
      toast({
        title: "Erro na Compressão",
        description: `Falha ao comprimir imagens: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
