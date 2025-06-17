
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
      console.log('Fetching filter options for category:', category, 'filterType:', filterType);
      
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

      // Optimize translation mapping
      const translatedData = data?.map(option => {
        let translatedLabel = option.option_label;
        let translatedValue = option.option_value;
        
        // Apply translations based on filter type
        const labelKey = `filters.${category}.${option.filter_type}`;
        const fallbackKey = `filters.${option.filter_type}`;
        
        if (t(labelKey) !== labelKey) {
          translatedLabel = t(labelKey);
        } else if (t(fallbackKey) !== fallbackKey) {
          translatedLabel = t(fallbackKey);
        }
        
        // Handle specific value translations
        if (option.filter_type === 'condition') {
          const conditionKey = `admin.${option.option_value}`;
          if (t(conditionKey) !== conditionKey) {
            translatedValue = t(conditionKey);
          }
        } else if (option.filter_type === 'transmission') {
          if (option.option_value === 'automated-manual') {
            translatedValue = t('admin.automatedManual');
          } else {
            const transmissionKey = `admin.${option.option_value}`;
            if (t(transmissionKey) !== transmissionKey) {
              translatedValue = t(transmissionKey);
            }
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
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes (filter options are quite static)
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
};
