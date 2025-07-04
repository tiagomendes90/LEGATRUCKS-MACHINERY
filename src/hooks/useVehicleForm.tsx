
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
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
  const { data: brands = [], isLoading: brandsLoading, error: brandsError } = useNewVehicleBrands();
  const { uploadImages, isUploading } = useImageKitUpload();

  // Get selected category info
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const selectedCategoryName = selectedCategory?.name?.toLowerCase();

  // Filter subcategories based on selected category
  const availableSubcategories = selectedCategory?.subcategories || [];

  // Filter brands based on selected category
  const availableBrands = useMemo(() => {
    if (!selectedCategoryId || !brands.length || !categories.length) return [];
    
    const categoryName = categories.find(cat => cat.id === selectedCategoryId)?.name;
    if (!categoryName) return [];
    
    return brands.filter(brand => 
      brand.category?.includes(categoryName)
    );
  }, [selectedCategoryId, brands, categories]);

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
    
    switch (selectedCategoryName) {
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

  const submitVehicle = async () => {
    setIsSubmitting(true);

    try {
      const cleanPrice = formData.price_eur.replace(/,/g, '');
      
      const vehicleData = {
        title: formData.title,
        description: formData.description || null,
        price_eur: parseFloat(cleanPrice),
        registration_year: parseInt(formData.registration_year),
        condition: formData.condition,
        brand_id: formData.brand_id,
        subcategory_id: formData.subcategory_id,
        mileage_km: formData.mileage_km ? parseInt(formData.mileage_km) : null,
        operating_hours: formData.operating_hours ? parseInt(formData.operating_hours) : null,
        axles: formData.axles ? parseInt(formData.axles) : null,
        power_ps: formData.power_ps ? parseInt(formData.power_ps) : null,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
        fuel_type: formData.fuel_type || null,
        gearbox: formData.gearbox || null,
        drivetrain: formData.drivetrain || null,
        body_color: formData.body_color || null,
        location: formData.location || null,
        contact_info: formData.contact_info || null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      console.log('🚀 Creating vehicle with data:', vehicleData);

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (vehicleError) {
        console.error('Vehicle creation error:', vehicleError);
        throw vehicleError;
      }

      console.log('✅ Vehicle created:', vehicle.id);

      const allImages = mainImage ? [mainImage, ...secondaryImages] : secondaryImages;
      
      if (allImages.length > 0) {
        toast({
          title: "A carregar imagens...",
          description: "Otimizando imagens via ImageKit...",
        });

        await uploadImages(allImages, vehicle.id);
      }

      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      toast({
        title: "Sucesso!",
        description: `Veículo "${vehicle.title}" adicionado com sucesso!`,
      });

      resetForm();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar veículo. Tente novamente.",
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
