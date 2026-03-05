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
  price: string;
  year: string;
  condition: string;
  brand_id: string;
  subcategory_id: string;
  model: string;
  currency: string;
  stock_status: string;
  location_country: string;
  location_city: string;
  is_active: boolean;
}

const initialFormData: VehicleFormData = {
  title: "",
  description: "",
  price: "",
  year: "",
  condition: "used",
  brand_id: "",
  subcategory_id: "",
  model: "",
  currency: "EUR",
  stock_status: "disponivel",
  location_country: "",
  location_city: "",
  is_active: true,
};

export const useVehicleForm = () => {
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const categoriesQuery = useCategories();
  const brandsQuery = useNewVehicleBrands();
  const imageUploadHook = useImageKitUpload();

  const categories = categoriesQuery?.data || [];
  const allBrands = brandsQuery?.data || [];
  const { uploadImages, isUploading } = imageUploadHook || { uploadImages: null, isUploading: false };

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId || !categories.length) return null;
    return categories.find(cat => cat.id === selectedCategoryId) || null;
  }, [selectedCategoryId, categories]);

  const selectedCategoryName = selectedCategory?.name || null;

  // All brands available (no category filtering on brands table - use category_brands if needed)
  const availableBrands = useMemo(() => {
    return allBrands;
  }, [allBrands]);

  const availableSubcategories = useMemo(() => {
    return selectedCategory?.subcategories || [];
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategoryId) {
      setFormData(prev => ({ ...prev, subcategory_id: "", brand_id: "" }));
    }
  }, [selectedCategoryId]);

  const handleInputChange = (field: keyof VehicleFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedCategoryId("");
    setMainImage(null);
    setMainImageUrl(null);
    setSecondaryImages([]);
    setCurrentTab("basic");
  };

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
      toast({ title: "Erro", description: "Função de upload não disponível", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const requiredFields = ['title', 'brand_id', 'subcategory_id', 'year', 'price'];
      for (const field of requiredFields) {
        if (!formData[field as keyof VehicleFormData]) {
          throw new Error(`Campo obrigatório em falta: ${field}`);
        }
      }

      const parsedYear = safeParseInt(formData.year);
      const parsedPrice = safeParseFloat(formData.price);

      if (!parsedYear || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 1) {
        throw new Error('Ano deve ser válido');
      }
      if (!parsedPrice || parsedPrice <= 0) {
        throw new Error('Preço deve ser maior que zero');
      }

      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: parsedPrice,
        year: parsedYear,
        condition: formData.condition,
        brand_id: formData.brand_id,
        subcategory_id: formData.subcategory_id,
        category_id: selectedCategoryId || null,
        model: formData.model || null,
        currency: formData.currency,
        stock_status: formData.stock_status,
        location_country: formData.location_country || null,
        location_city: formData.location_city || null,
        is_active: formData.is_active,
      };

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (productError) throw new Error(`Erro na base de dados: ${productError.message}`);

      if (secondaryImages.length > 0 && product?.id) {
        try {
          await uploadImages(secondaryImages, product.id);
        } catch (imageError) {
          toast({ title: "Aviso", description: "Produto criado mas falha no upload de imagens.", variant: "destructive" });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: "Sucesso!", description: `Produto "${product.title}" adicionado!` });
      resetForm();
      return product;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    selectedCategoryId,
    mainImage,
    mainImageUrl,
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
    setMainImageUrl,
    setSecondaryImages,
    setCurrentTab,
    submitVehicle,
    resetForm
  };
};
