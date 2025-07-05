
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
import { getDistanceField } from "@/utils/categoryFieldHelpers";

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
    resetForm,
    availableBrands,
    submitVehicle,
    isSubmitting,
    isUploading
  } = useVehicleForm();

  const updateVehicleMutation = useUpdateVehicle();

  const isEditMode = !!editingVehicle;

  // Load editing vehicle data - Fixed to prevent infinite loop
  useEffect(() => {
    if (editingVehicle && editingVehicle.id) {
      console.log('Loading vehicle data for editing:', editingVehicle.id);
      
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

      // Find and set category ID
      if (editingVehicle.subcategory_id) {
        const category = categories.find(cat => 
          cat.subcategories?.some(sub => sub.id === editingVehicle.subcategory_id)
        );
        if (category) {
          setSelectedCategoryId(category.id);
        }
      }
    }
  }, [editingVehicle?.id]); // Only depend on the vehicle ID to prevent infinite loops

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

  const distanceField = subcategory ? getDistanceField(subcategory.slug) : null;

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
    
    console.log('🎯 Form submitted, current tab:', currentTab);
    console.log('📝 Form data at submit:', formData);

    if (!validateVehicleFormTab(currentTab, formData, distanceField, mainImage, toast)) {
      console.log('❌ Validation failed for tab:', currentTab);
      return;
    }

    try {
      if (isEditMode) {
        console.log('🔧 Editing vehicle:', editingVehicle.id);
        // Handle edit mode logic here if needed
        // For now, focus on the creation issue
      } else {
        console.log('➕ Adding new vehicle...');
        const result = await submitVehicle();
        
        if (result && onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      // Error is already handled in submitVehicle
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
              availableBrands={availableBrands}
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
            isSubmitting={isSubmitting || updateVehicleMutation.isPending}
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
