
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
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { uploadImages, isUploading } = useImageKitUpload();

  // Get selected category info
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const selectedCategoryName = selectedCategory?.name;

  console.log('🏗️ useVehicleForm Debug:');
  console.log('📂 Selected Category ID:', selectedCategoryId);
  console.log('📂 Selected Category Name:', selectedCategoryName);

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
    console.log(`🔄 Field changed: ${field} = ${value}`);
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
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  };

  const submitVehicle = async () => {
    setIsSubmitting(true);

    try {
      console.log('🚀 Starting vehicle submission...');
      console.log('📝 Raw form data:', formData);

      // Validate required fields
      const requiredFields = ['title', 'brand_id', 'subcategory_id', 'registration_year', 'price_eur'];
      for (const field of requiredFields) {
        if (!formData[field as keyof VehicleFormData]) {
          throw new Error(`Campo obrigatório em falta: ${field}`);
        }
      }

      // Upload main image first if exists
      let mainImageUrl = null;
      if (mainImage) {
        console.log('📤 Uploading main image...');
        try {
          const uploadedImages = await uploadImages([mainImage], 'temp');
          if (uploadedImages && uploadedImages.length > 0) {
            mainImageUrl = uploadedImages[0].url;
            console.log('✅ Main image uploaded:', mainImageUrl);
          }
        } catch (imageError) {
          console.error('❌ Image upload failed:', imageError);
          toast({
            title: "Aviso",
            description: "Falha no upload da imagem, mas o veículo será criado sem imagem.",
            variant: "destructive",
          });
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

      // Prepare vehicle data with correct types and null handling
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
        main_image_url: mainImageUrl,
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
