
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useVehicleBrandsByCategory } from '@/hooks/useNewVehicleBrands';
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
  motor_description: string;
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
  motor_description: "",
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
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { uploadImages, isUploading } = useImageKitUpload();

  // Get selected category info
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const selectedCategoryName = selectedCategory?.name;

  // Debug logs for category selection
  console.log('🏗️ useVehicleForm Debug:');
  console.log('📂 Selected Category ID:', selectedCategoryId);
  console.log('📂 Selected Category Name:', selectedCategoryName);
  console.log('🏷️ Categories available:', categories.length);

  // Use the category-filtered brands hook
  const { data: brands = [], isLoading: brandsLoading, error: brandsError } = useVehicleBrandsByCategory(selectedCategoryName);

  // Filter subcategories based on selected category
  const availableSubcategories = selectedCategory?.subcategories || [];

  // Available brands are now directly from the filtered hook
  const availableBrands = brands;

  // Reset subcategory and brand when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      setFormData(prev => ({ 
        ...prev, 
        subcategory_id: "",
        brand_id: "",
        mileage_km: "",
        operating_hours: ""
      }));
    }
  }, [selectedCategoryId]);

  // Determine which distance field to show based on category
  const getDistanceFieldInfo = () => {
    if (!selectedCategoryName) return null;
    
    switch (selectedCategoryName.toLowerCase()) {
      case 'trucks':
        return {
          field: 'mileage_km' as keyof VehicleFormData,
          label: 'Quilómetros (km)',
          placeholder: 'Ex: 150000'
        };
      case 'machinery':
      case 'agriculture':
        return {
          field: 'operating_hours' as keyof VehicleFormData,
          label: 'Horas de Funcionamento (h)',
          placeholder: 'Ex: 5000'
        };
      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof VehicleFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
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
    // Remove commas and parse
    const cleanValue = value.replace(/,/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  };

  const submitVehicle = async () => {
    setIsSubmitting(true);

    try {
      console.log('🚀 Starting vehicle submission...');
      console.log('📝 Form data before processing:', formData);

      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório');
      }
      if (!formData.brand_id) {
        throw new Error('Marca é obrigatória');
      }
      if (!formData.subcategory_id) {
        throw new Error('Subcategoria é obrigatória');
      }
      if (!formData.registration_year) {
        throw new Error('Ano é obrigatório');
      }
      if (!formData.price_eur) {
        throw new Error('Preço é obrigatório');
      }

      // Upload images first if they exist
      let mainImageUrl = '';
      const allImages = mainImage ? [mainImage, ...secondaryImages] : secondaryImages;
      
      if (allImages.length > 0) {
        console.log('📤 Uploading images...');
        toast({
          title: "A carregar imagens...",
          description: "Otimizando imagens via ImageKit...",
        });

        try {
          const uploadedImages = await uploadImages(allImages, 'temp');
          if (mainImage && uploadedImages.length > 0) {
            mainImageUrl = uploadedImages[0].url;
            console.log('✅ Main image uploaded:', mainImageUrl);
          }
        } catch (imageError) {
          console.error('❌ Image upload failed:', imageError);
          // Continue without images if upload fails
          toast({
            title: "Aviso",
            description: "Falha no upload de imagens, mas o veículo será criado sem imagens.",
            variant: "destructive",
          });
        }
      }

      // Prepare vehicle data with correct types
      const vehicleData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price_eur: safeParseFloat(formData.price_eur),
        registration_year: safeParseInt(formData.registration_year),
        condition: formData.condition,
        brand_id: formData.brand_id,
        subcategory_id: formData.subcategory_id,
        mileage_km: safeParseInt(formData.mileage_km),
        operating_hours: safeParseInt(formData.operating_hours),
        axles: safeParseInt(formData.axles),
        power_ps: safeParseInt(formData.power_ps),
        weight_kg: safeParseInt(formData.weight_kg),
        fuel_type: formData.fuel_type || null,
        gearbox: formData.gearbox || null,
        drivetrain: formData.drivetrain || null,
        body_color: formData.body_color || null,
        location: formData.location || null,
        contact_info: formData.contact_info || null,
        main_image_url: mainImageUrl || null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      console.log('📋 Prepared vehicle data:', vehicleData);

      // Validate numeric fields
      if (!vehicleData.price_eur || vehicleData.price_eur <= 0) {
        throw new Error('Preço deve ser um valor válido maior que zero');
      }
      if (!vehicleData.registration_year || vehicleData.registration_year < 1900 || vehicleData.registration_year > new Date().getFullYear() + 1) {
        throw new Error('Ano deve ser um valor válido');
      }

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (vehicleError) {
        console.error('❌ Vehicle creation error:', vehicleError);
        throw vehicleError;
      }

      console.log('✅ Vehicle created successfully:', vehicle.id);

      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      toast({
        title: "Sucesso!",
        description: `Veículo "${vehicle.title}" adicionado com sucesso!`,
      });

      resetForm();
    } catch (error) {
      console.error('❌ Error adding vehicle:', error);
      const errorMessage = error.message || 'Erro desconhecido ao adicionar veículo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    selectedCategoryId,
    mainImage,
    secondaryImages,
    currentTab,
    isSubmitting,
    isUploading,
    categoriesLoading,
    brandsLoading,
    brandsError,
    categories,
    availableSubcategories,
    availableBrands,
    handleInputChange,
    setSelectedCategoryId,
    setMainImage,
    setSecondaryImages,
    setCurrentTab,
    getDistanceFieldInfo,
    submitVehicle,
    resetForm
  };
};
