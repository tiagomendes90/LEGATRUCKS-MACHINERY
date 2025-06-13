
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

      // Map the data to include translated labels
      const translatedData = data?.map(option => {
        let translatedLabel = option.option_label;
        
        // Translate the filter type labels using the correct translation keys
        if (filterType === 'brand') {
          translatedLabel = t('filters.brand');
        } else if (filterType === 'model') {
          translatedLabel = t('filters.model');
        } else if (filterType === 'condition') {
          translatedLabel = t('filters.condition');
        } else if (filterType === 'transmission') {
          translatedLabel = t('filters.transmission');
        } else if (filterType === 'engine_type') {
          translatedLabel = t('filters.engineType');
        } else if (filterType === 'fuel_type') {
          translatedLabel = t('filters.fuelType');
        } else if (filterType === 'horsepower') {
          translatedLabel = t('filters.horsepower');
        } else if (filterType === 'weight') {
          translatedLabel = t('filters.weight');
        } else if (filterType === 'attachment') {
          translatedLabel = t('filters.attachment');
        } else if (filterType === 'drive_type') {
          translatedLabel = t('filters.driveType');
        } else if (filterType === 'operating_hours') {
          translatedLabel = t('filters.operatingHours');
        } else if (filterType === 'mileage') {
          translatedLabel = t('filters.mileage');
        } else if (filterType === 'year') {
          translatedLabel = t('filters.year');
        } else if (filterType === 'price') {
          translatedLabel = t('filters.price');
        } else if (filterType === 'location') {
          translatedLabel = t('filters.location');
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
