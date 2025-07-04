
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useVehicleForm } from "@/hooks/useVehicleForm";
import { useAddVehicle, useUpdateVehicle } from "@/hooks/useVehicles";
import { VehicleBasicInfoForm } from "@/components/vehicle-form/VehicleBasicInfoForm";
import { VehicleSpecsForm } from "@/components/vehicle-form/VehicleSpecsForm";
import { VehicleImagesForm } from "@/components/vehicle-form/VehicleImagesForm";
import { VehicleSettingsForm } from "@/components/vehicle-form/VehicleSettingsForm";
import { VehicleFormNavigation } from "@/components/vehicle-form/VehicleFormNavigation";
import { validateVehicleFormTab } from "@/components/vehicle-form/VehicleFormValidation";
import { useCategories } from "@/hooks/useCategories";
import CategoryFieldMapper from "@/components/CategoryFieldMapper";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";

interface AddVehicleFormProps {
  editingVehicle?: any;
  onSuccess?: () => void;  
  onCancel?: () => void;
}

const AddVehicleForm = ({ editingVehicle, onSuccess, onCancel }: AddVehicleFormProps) => {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  
  const {
    formData,
    selectedCategoryId,
    mainImage,
    setMainImage,
    secondaryImages,
    setSecondaryImages,
    currentTab,
    setCurrentTab,
    handleInputChange,
    setSelectedCategoryId,
    resetForm
  } = useVehicleForm();

  const addVehicleMutation = useAddVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const { uploadImages, isUploading } = useImageKitUpload();

  const isEditMode = !!editingVehicle;

  // Load editing vehicle data
  useEffect(() => {
    if (editingVehicle) {
      // Set form data for editing
      handleInputChange('title', editingVehicle.title || '');
      handleInputChange('description', editingVehicle.description || '');
      handleInputChange('brand_id', editingVehicle.brand_id || '');
      handleInputChange('subcategory_id', editingVehicle.subcategory_id || '');
      handleInputChange('condition', editingVehicle.condition || 'used');
      handleInputChange('registration_year', editingVehicle.registration_year?.toString() || '');
      handleInputChange('mileage_km', editingVehicle.mileage_km?.toString() || '');
      handleInputChange('operating_hours', editingVehicle.operating_hours?.toString() || '');
      handleInputChange('price_eur', editingVehicle.price_eur?.toString() || '');
      handleInputChange('fuel_type', editingVehicle.fuel_type || '');
      handleInputChange('gearbox', editingVehicle.gearbox || '');
      handleInputChange('power_ps', editingVehicle.power_ps?.toString() || '');
      handleInputChange('drivetrain', editingVehicle.drivetrain || '');
      handleInputChange('axles', editingVehicle.axles?.toString() || '');
      handleInputChange('weight_kg', editingVehicle.weight_kg?.toString() || '');
      handleInputChange('body_color', editingVehicle.body_color || '');
      handleInputChange('location', editingVehicle.location || '');
      handleInputChange('contact_info', editingVehicle.contact_info || '');
      handleInputChange('is_active', editingVehicle.is_active ?? true);
      handleInputChange('is_featured', editingVehicle.is_featured ?? false);
      handleInputChange('is_published', editingVehicle.is_published ?? false);
    }
  }, [editingVehicle, handleInputChange]);

  const tabs = [
    { id: "basic", label: "Informações Básicas" },
    { id: "specs", label: "Especificações" },
    { id: "images", label: "Imagens" },
    { id: "settings", label: "Configurações" }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === currentTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  const subcategory = categories
    .flatMap(cat => cat.subcategories || [])
    .find(sub => sub.id === formData.subcategory_id);

  const distanceField = subcategory ? CategoryFieldMapper.getDistanceField(subcategory.slug) : null;

  const handleNext = () => {
    if (!validateVehicleFormTab(currentTab, formData, distanceField, mainImage, toast)) {
      return;
    }

    const nextIndex = Math.min(currentTabIndex + 1, tabs.length - 1);
    setCurrentTab(tabs[nextIndex].id);
  };

  const handlePrevious = () => {
    const prevIndex = Math.max(currentTabIndex - 1, 0);
    setCurrentTab(tabs[prevIndex].id);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateVehicleFormTab(currentTab, formData, distanceField, mainImage, toast)) {
      return;
    }

    try {
      const cleanPrice = formData.price_eur.replace(/,/g, '');
      let mainImageUrl = editingVehicle?.main_image_url || '';

      // Handle image uploads
      if (mainImage || secondaryImages.length > 0) {
        const allImages = [];
        if (mainImage) allImages.push(mainImage);
        allImages.push(...secondaryImages);

        const uploadedImages = await uploadImages(allImages, editingVehicle?.id || 'temp');
        
        if (mainImage && uploadedImages.length > 0) {
          mainImageUrl = uploadedImages[0].url;
        }
      }

      const vehicleData = {
        title: formData.title,
        description: formData.description,
        brand_id: formData.brand_id,  
        subcategory_id: formData.subcategory_id,
        condition: formData.condition as 'new' | 'used' | 'restored' | 'modified',
        registration_year: parseInt(formData.registration_year),
        mileage_km: formData.mileage_km ? parseInt(formData.mileage_km) : undefined,
        operating_hours: formData.operating_hours ? parseInt(formData.operating_hours) : undefined,
        price_eur: parseFloat(cleanPrice),
        fuel_type: formData.fuel_type as 'diesel' | 'electric' | 'hybrid' | 'petrol' | 'gas',
        gearbox: formData.gearbox as 'manual' | 'automatic' | 'semi-automatic',
        power_ps: formData.power_ps ? parseInt(formData.power_ps) : undefined,
        drivetrain: formData.drivetrain as '4x2' | '4x4' | '6x2' | '6x4' | '8x4' | '8x6',
        axles: formData.axles ? parseInt(formData.axles) : undefined,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : undefined,
        body_color: formData.body_color,
        main_image_url: mainImageUrl,
        location: formData.location,
        contact_info: formData.contact_info,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
      };

      if (isEditMode) {
        await updateVehicleMutation.mutateAsync({
          id: editingVehicle.id,
          ...vehicleData
        });
        toast({
          title: "Sucesso",
          description: "Veículo atualizado com sucesso!",
        });
      } else {
        await addVehicleMutation.mutateAsync(vehicleData);
        toast({
          title: "Sucesso", 
          description: "Veículo adicionado com sucesso!",
        });
        resetForm();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting vehicle:', error);
      toast({
        title: "Erro",
        description: isEditMode ? "Erro ao atualizar veículo." : "Erro ao adicionar veículo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Editar Veículo" : "Adicionar Novo Veículo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <VehicleBasicInfoForm 
              formData={formData}
              selectedCategoryId={selectedCategoryId}
              categories={categories}
              availableSubcategories={categories.find(cat => cat.id === selectedCategoryId)?.subcategories || []}
              availableBrands={[]}
              distanceField={distanceField}
              onInputChange={handleInputChange}
              onCategoryChange={setSelectedCategoryId}
            />

            <VehicleSpecsForm 
              formData={formData}
              onInputChange={handleInputChange}
            />

            <VehicleImagesForm
              mainImage={mainImage}
              secondaryImages={secondaryImages}
              onMainImageChange={setMainImage}
              onSecondaryImagesChange={setSecondaryImages}
            />

            <VehicleSettingsForm
              formData={formData}
              onInputChange={handleInputChange}
            />
          </Tabs>

          <VehicleFormNavigation
            currentTab={currentTab}
            isFirstTab={isFirstTab}
            isLastTab={isLastTab}
            isSubmitting={addVehicleMutation.isPending || updateVehicleMutation.isPending}
            isUploading={isUploading}
            onPrevious={handlePrevious}
            onCancel={handleCancel}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default AddVehicleForm;
