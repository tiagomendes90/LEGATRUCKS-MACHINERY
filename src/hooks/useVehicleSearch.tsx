
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from './useVehicles';

export interface VehicleSearchFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  condition?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  operatingHoursFrom?: number;
  operatingHoursTo?: number;
  powerFrom?: number;
  powerTo?: number;
  location?: string;
  keyword?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'year_new' | 'year_old' | 'created_recent' | 'created_old';
  limit?: number;
  offset?: number;
}

export const useVehicleSearch = (filters: VehicleSearchFilters = {}) => {
  return useQuery({
    queryKey: ['vehicle-search', filters],
    queryFn: async () => {
      console.log('Searching vehicles with filters:', filters);
      
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          brand:vehicle_brands(name, slug),
          subcategory:subcategories(
            name, 
            slug,
            category:categories(name, slug)
          ),
          images:vehicle_images(image_url, sort_order)
        `)
        .eq('is_active', true)
        .eq('is_published', true);

      // Apply category filter
      if (filters.category) {
        query = query.eq('subcategory.category.slug', filters.category);
      }

      // Apply subcategory filter
      if (filters.subcategory) {
        query = query.eq('subcategory.slug', filters.subcategory);
      }

      // Apply brand filter
      if (filters.brand) {
        query = query.eq('brand.slug', filters.brand);
      }

      // Apply condition filter
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      // Apply year filters
      if (filters.yearFrom) {
        query = query.gte('registration_year', filters.yearFrom);
      }
      if (filters.yearTo) {
        query = query.lte('registration_year', filters.yearTo);
      }

      // Apply price filters
      if (filters.priceFrom) {
        query = query.gte('price_eur', filters.priceFrom);
      }
      if (filters.priceTo) {
        query = query.lte('price_eur', filters.priceTo);
      }

      // Apply mileage filters (for trucks)
      if (filters.mileageFrom) {
        query = query.gte('mileage_km', filters.mileageFrom);
      }
      if (filters.mileageTo) {
        query = query.lte('mileage_km', filters.mileageTo);
      }

      // Apply operating hours filters (for machinery)
      if (filters.operatingHoursFrom) {
        query = query.gte('operating_hours', filters.operatingHoursFrom);
      }
      if (filters.operatingHoursTo) {
        query = query.lte('operating_hours', filters.operatingHoursTo);
      }

      // Apply power filters
      if (filters.powerFrom) {
        query = query.gte('power_ps', filters.powerFrom);
      }
      if (filters.powerTo) {
        query = query.lte('power_ps', filters.powerTo);
      }

      // Apply location filter
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Apply keyword search (title and description)
      if (filters.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price_eur', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_eur', { ascending: false });
          break;
        case 'year_new':
          query = query.order('registration_year', { ascending: false });
          break;
        case 'year_old':
          query = query.order('registration_year', { ascending: true });
          break;
        case 'created_recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'created_old':
          query = query.order('created_at', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching vehicles:', error);
        throw error;
      }

      console.log('Vehicle search results:', data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useLatestVehicles = (limit = 6) => {
  return useQuery({
    queryKey: ['latest-vehicles', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          brand:vehicle_brands(name, slug),
          subcategory:subcategories(
            name, 
            slug,
            category:categories(name, slug)
          ),
          images:vehicle_images(image_url, sort_order)
        `)
        .eq('is_active', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching latest vehicles:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
  });
};
