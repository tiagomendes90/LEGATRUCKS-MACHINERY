
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export interface FilterOption {
  id: string;
  category: string;
  filter_type: string;
  option_value: string;
  option_label: string;
  sort_order: number | null;
  created_at?: string;
  updated_at?: string;
}

export const useFilterOptions = (category: string, filterType?: string) => {
  const { t } = useTranslation();
  
  return useQuery({
    queryKey: ['filter-options', category, filterType],
    queryFn: async () => {
      console.log('Fetching filter options from database for category:', category, 'filterType:', filterType);
      
      let query = supabase
        .from('filter_options')
        .select('*')
        .eq('category', category)
        .order('sort_order');
      
      if (filterType) {
        query = query.eq('filter_type', filterType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filter options:', error);
        throw error;
      }

      // Map the data to include translated labels based on category
      const translatedData = data?.map(option => {
        let translatedLabel = option.option_label;
        
        // Use category-specific translations for filter labels
        if (filterType === 'brand') {
          translatedLabel = t(`filters.${category}.brand`);
        } else if (filterType === 'model') {
          translatedLabel = t(`filters.${category}.model`);
        } else if (filterType === 'condition') {
          translatedLabel = t(`filters.${category}.condition`);
        } else if (filterType === 'transmission') {
          translatedLabel = t(`filters.${category}.transmission`);
        } else if (filterType === 'engine_type') {
          translatedLabel = t(`filters.${category}.engineType`);
        } else if (filterType === 'fuel_type') {
          translatedLabel = t(`filters.${category}.fuelType`);
        } else if (filterType === 'horsepower') {
          translatedLabel = t(`filters.${category}.horsepower`);
        } else if (filterType === 'weight') {
          translatedLabel = t(`filters.${category}.weight`);
        } else if (filterType === 'attachment') {
          translatedLabel = t(`filters.${category}.attachment`);
        } else if (filterType === 'drive_type') {
          translatedLabel = t(`filters.${category}.driveType`);
        }
        
        return {
          ...option,
          option_label: translatedLabel
        };
      }) || [];

      console.log('Filter options fetched successfully:', translatedData.length, 'options found');
      return translatedData;
    },
  });
};
