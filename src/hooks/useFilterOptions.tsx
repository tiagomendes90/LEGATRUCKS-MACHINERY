
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

      // Map the data to include translated labels and values
      const translatedData = data?.map(option => {
        let translatedLabel = option.option_label;
        let translatedValue = option.option_value;
        
        // Translate filter type labels using category-specific translations
        if (filterType === 'brand') {
          translatedLabel = t(`filters.${category}.brand`);
        } else if (filterType === 'model') {
          translatedLabel = t(`filters.${category}.model`);
        } else if (filterType === 'condition') {
          translatedLabel = t(`filters.${category}.condition`);
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

        // Translate option values for specific filter types
        if (filterType === 'condition') {
          // Translate condition values
          if (option.option_value === 'new') {
            translatedValue = t('admin.new');
          } else if (option.option_value === 'used') {
            translatedValue = t('admin.used');
          } else if (option.option_value === 'certified') {
            translatedValue = t('admin.certified');
          } else if (option.option_value === 'refurbished') {
            translatedValue = t('admin.refurbished');
          }
        } else if (filterType === 'transmission') {
          // Translate transmission values
          if (option.option_value === 'manual') {
            translatedValue = t('admin.manual');
          } else if (option.option_value === 'automatic') {
            translatedValue = t('admin.automatic');
          } else if (option.option_value === 'automated-manual') {
            translatedValue = t('admin.automatedManual');
          } else if (option.option_value === 'cvt') {
            translatedValue = t('admin.cvt');
          }
        }
        
        return {
          ...option,
          option_label: translatedLabel,
          option_value: translatedValue
        };
      }) || [];

      console.log('Filter options fetched successfully:', translatedData.length, 'options found');
      return translatedData;
    },
  });
};
