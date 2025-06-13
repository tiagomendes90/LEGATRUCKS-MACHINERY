
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
        // Start with original values
        let translatedLabel = option.option_label;
        let translatedValue = option.option_value;
        
        console.log('Translating option:', option.filter_type, option.option_value, 'for category:', category);
        
        // Translate filter type labels based on category and filter type
        const labelKey = `filters.${category}.${option.filter_type}`;
        const fallbackKey = `filters.${option.filter_type}`;
        
        // Try category-specific translation first, then fallback to general
        if (t(labelKey) !== labelKey) {
          translatedLabel = t(labelKey);
        } else if (t(fallbackKey) !== fallbackKey) {
          translatedLabel = t(fallbackKey);
        }
        
        // Translate specific option values
        if (option.filter_type === 'condition') {
          const conditionKey = `admin.${option.option_value}`;
          if (t(conditionKey) !== conditionKey) {
            translatedValue = t(conditionKey);
          }
        } else if (option.filter_type === 'transmission') {
          // Handle special case for automated-manual
          if (option.option_value === 'automated-manual') {
            translatedValue = t('admin.automatedManual');
          } else {
            const transmissionKey = `admin.${option.option_value}`;
            if (t(transmissionKey) !== transmissionKey) {
              translatedValue = t(transmissionKey);
            }
          }
        }
        
        console.log('Translation result:', {
          original: { label: option.option_label, value: option.option_value },
          translated: { label: translatedLabel, value: translatedValue }
        });
        
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
