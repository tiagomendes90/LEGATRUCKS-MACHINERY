
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useNewVehicleBrands } from '@/hooks/useNewVehicleBrands';
import { useImageKitUpload } from '@/hooks/useImageKitUpload';
import { useQueryClient } from '@tanstack/react-query';

export interface VehicleFormData {
  title: string;
  description: string;
  price_eur: string;
  registration_year: string;
  condition: string;
  brand_id: string;
  subcategory_id: string;
  fuel_type: string;
  gearbox: string;
  mileage_km: string;
  operating_hours: string;
  drivetrain: string;
  axles: string;
  power_ps: string;
  weight_kg: string;
  body_color: string;
  location: string;
  contact_info: string;
  is_published: boolean;
  is_featured: boolean;
  is_active: boolean;
}

const initialFormData: VehicleFormData = {
  title: "",
  description: "",
  price_eur: "",
  registration_year: "",
  condition: "used",
  brand_id: "",
  subcategory_id: "",
  fuel_type: "",
  gearbox: "",
  mileage_km: "",
  operating_hours: "",
  drivetrain: "",
  axles: "",
  power_ps: "",
  weight_kg: "",
  body_color: "",
  location: "",
  contact_info: "",
  is_published: false,
  is_featured: false,
  is_active: true,
};

export const useVehicleForm = () => {
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get data with proper error handling
  const categoriesQuery = useCategories();
  const brandsQuery = useNewVehicleBrands();
  const imageUploadHook = useImageKitUpload();

  // Safely extract data with fallbacks
  const categories = categoriesQuery?.data || [];
  const allBrands = brandsQuery?.data || [];
  const { uploadImages, isUploading } = imageUploadHook || { uploadImages: null, isUploading: false };

  console.log('🏗️ useVehicleForm Debug:');
  console.log('📂 Selected Category ID:', selectedCategoryId);
  console.log('📂 All Categories:', categories.length, 'categories loaded');
  console.log('🏷️ All Brands:', allBrands.length, 'brands loaded');

  // Get selected category info with better error handling
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId || !categories.length) return null;
    return categories.find(cat => cat.id === selectedCategoryId) || null;
  }, [selectedCategoryId, categories]);

  const selectedCategoryName = selectedCategory?.name || null;

  console.log('📂 Selected Category:', selectedCategory);
  console.log('📂 Selected Category Name:', selectedCategoryName);

  // Filter brands based on selected category with improved logic
  const availableBrands = useMemo(() => {
    console.log('🔍 Filtering brands...');
    console.log('🔍 Selected category name:', selectedCategoryName);
    console.log('🔍 All brands available:', allBrands.length);

    if (!selectedCategoryName || !allBrands.length) {
      console.log('🚫 No category selected or no brands available');
      return [];
    }

    try {
      const filteredBrands = allBrands.filter(brand => {
        if (!brand || !brand.category) {
          console.log(`🔍 Brand has no category:`, brand?.name || 'unnamed');
          return false;
        }
        
        if (!Array.isArray(brand.category)) {
          console.log(`🔍 Brand "${brand.name}" category is not an array:`, brand.category);
          return false;
        }
        
        // Check if any category in the brand matches the selected category (case insensitive)
        const hasMatchingCategory = brand.category.some(cat => {
          if (typeof cat !== 'string') return false;
          return cat.toLowerCase().trim() === selectedCategoryName.toLowerCase().trim();
        });
        
        console.log(`🔍 Brand "${brand.name}" categories:`, brand.category);
        console.log(`🔍 Does "${brand.name}" match "${selectedCategoryName}"?`, hasMatchingCategory);
        
        return hasMatchingCategory;
      });

      console.log('✅ Filtered brands:', filteredBrands.length, 'brands match');
      console.log('✅ Brand names:', filteredBrands.map(b => b.name));
      return filteredBrands;
    } catch (error) {
      console.error('❌ Error filtering brands:', error);
      return [];
    }
  }, [selectedCategoryName, allBrands]);

  // Filter subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    return selectedCategory?.subcategories || [];
  }, [selectedCategory]);

  // Reset dependent fields when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      console.log('🔄 Category changed, resetting dependent fields');
      setFormData(prev => ({ 
        ...prev, 
        subcategory_id: "",
        brand_id: "",
        mileage_km: "",
        operating_hours: ""
      }));
    }
  }, [selectedCategoryId]);

  const handleInputChange = (field: keyof VehicleFormData, value: string | boolean) => {
    console.log(`🔄 Field changed: ${field} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    console.log('🔄 Resetting form');
    setFormData(initialFormData);
    setSelectedCategoryId("");
    setMainImage(null);
    setSecondaryImages([]);
    setCurrentTab("basic");
  };

  // Helper function to safely convert string to number
  const safeParseInt = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const safeParseFloat = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  };

  const submitVehicle = async () => {
    if (!uploadImages) {
      console.error('❌ Upload function not available');
      toast({
        title: "Erro",
        description: "Função de upload não disponível",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Starting vehicle submission...');
      console.log('📝 Raw form data:', formData);
      console.log('🖼️ Main image:', mainImage);

      // Validate required fields
      const requiredFields = ['title', 'brand_id', 'subcategory_id', 'registration_year', 'price_eur'];
      for (const field of requiredFields) {
        if (!formData[field as keyof VehicleFormData]) {
          throw new Error(`Campo obrigatório em falta: ${field}`);
        }
      }

      // Parse numeric values properly
      const parsedRegistrationYear = safeParseInt(formData.registration_year);
      const parsedPrice = safeParseFloat(formData.price_eur);
      const parsedMileage = safeParseInt(formData.mileage_km);
      const parsedOperatingHours = safeParseInt(formData.operating_hours);
      const parsedAxles = safeParseInt(formData.axles);
      const parsedPowerPs = safeParseInt(formData.power_ps);
      const parsedWeightKg = safeParseInt(formData.weight_kg);

      console.log('🔢 Parsed values:', {
        registration_year: parsedRegistrationYear,
        price_eur: parsedPrice,
        mileage_km: parsedMileage,
        operating_hours: parsedOperatingHours
      });

      // Validate parsed values
      if (!parsedRegistrationYear || parsedRegistrationYear < 1900 || parsedRegistrationYear > new Date().getFullYear() + 1) {
        throw new Error('Ano deve ser um valor válido entre 1900 e ' + (new Date().getFullYear() + 1));
      }

      if (!parsedPrice || parsedPrice <= 0) {
        throw new Error('Preço deve ser um valor válido maior que zero');
      }

      // First create the vehicle record without image
      const vehicleData = {
        title: formData.title.trim(),
        description: formData.description.trim() || '',
        price_eur: parsedPrice,
        registration_year: parsedRegistrationYear,
        condition: formData.condition,
        brand_id: formData.brand_id,
        subcategory_id: formData.subcategory_id,
        mileage_km: parsedMileage,
        operating_hours: parsedOperatingHours,
        axles: parsedAxles,
        power_ps: parsedPowerPs,
        weight_kg: parsedWeightKg,
        fuel_type: formData.fuel_type || null,
        gearbox: formData.gearbox || null,
        drivetrain: formData.drivetrain || null,
        body_color: formData.body_color || null,
        location: formData.location || null,
        contact_info: formData.contact_info || null,
        main_image_url: null, // Will be updated after image upload
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      console.log('📋 Final vehicle data for insert:', vehicleData);

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (vehicleError) {
        console.error('❌ Vehicle creation error:', vehicleError);
        throw new Error(`Erro na base de dados: ${vehicleError.message}`);
      }

      console.log('✅ Vehicle created successfully:', vehicle);

      // Now upload main image if exists and update the vehicle
      if (mainImage && vehicle?.id) {
        console.log('📤 Uploading main image for vehicle:', vehicle.id);
        try {
          const uploadedImages = await uploadImages([mainImage], vehicle.id);
          if (uploadedImages && uploadedImages.length > 0) {
            const mainImageUrl = uploadedImages[0].url;
            console.log('✅ Main image uploaded:', mainImageUrl);
            
            // Update vehicle with main image URL
            const { error: updateError } = await supabase
              .from('vehicles')
              .update({ main_image_url: mainImageUrl })
              .eq('id', vehicle.id);

            if (updateError) {
              console.error('❌ Error updating vehicle with image:', updateError);
              // Don't fail the whole operation, just warn
              toast({
                title: "Aviso",
                description: "Veículo criado mas falha ao associar imagem principal.",
                variant: "destructive",
              });
            } else {
              console.log('✅ Vehicle updated with main image URL');
            }
          }
        } catch (imageError) {
          console.error('❌ Image upload failed:', imageError);
          toast({
            title: "Aviso",
            description: "Veículo criado mas falha no upload da imagem.",
            variant: "destructive",
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      toast({
        title: "Sucesso!",
        description: `Veículo "${vehicle.title}" adicionado com sucesso!`,
      });

      resetForm();
      return vehicle;

    } catch (error) {
      console.error('❌ Error adding vehicle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao adicionar veículo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return hook data with comprehensive error handling
  const hookData = {
    formData,
    selectedCategoryId,
    mainImage,
    secondaryImages,
    currentTab,
    isSubmitting,
    isUploading,
    categoriesLoading: categoriesQuery?.isLoading || false,
    brandsLoading: brandsQuery?.isLoading || false,
    brandsError: brandsQuery?.error || null,
    categories,
    availableSubcategories,
    availableBrands,
    handleInputChange,
    setSelectedCategoryId,
    setMainImage,
    setSecondaryImages,
    setCurrentTab,
    submitVehicle,
    resetForm
  };

  console.log('🎯 Hook returning data:', {
    categoriesCount: categories.length,
    brandsCount: availableBrands.length,
    selectedCategoryId,
    selectedCategoryName
  });

  return hookData;
};
