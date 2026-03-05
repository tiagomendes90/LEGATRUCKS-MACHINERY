
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useVehicleForm } from "@/hooks/useVehicleForm";
import { useUpdateVehicle } from "@/hooks/useVehicles";
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
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const vehicleFormHook = useVehicleForm();
  const updateVehicleMutation = useUpdateVehicle();
  const isEditMode = !!editingVehicle;

  const {
    formData, selectedCategoryId, mainImage, mainImageUrl,
    setMainImage, setMainImageUrl, secondaryImages, setSecondaryImages,
    currentTab, setCurrentTab, handleInputChange, setSelectedCategoryId,
    resetForm, availableBrands, submitVehicle, isSubmitting, isUploading,
    categoriesLoading: formCategoriesLoading, brandsLoading
  } = vehicleFormHook;

  // Load editing vehicle data
  useEffect(() => {
    if (editingVehicle && editingVehicle.id && !formData.title) {
      handleInputChange('title', editingVehicle.title || '');
      handleInputChange('description', editingVehicle.description || '');
      handleInputChange('brand_id', editingVehicle.brand_id || '');
      handleInputChange('subcategory_id', editingVehicle.subcategory_id || '');
      handleInputChange('condition', editingVehicle.condition || 'used');
      handleInputChange('year', editingVehicle.year?.toString() || '');
      handleInputChange('price', editingVehicle.price?.toString() || '');
      handleInputChange('model', editingVehicle.model || '');
      handleInputChange('is_active', editingVehicle.is_active ?? true);

      if (editingVehicle.subcategory_id && categories.length > 0) {
        const category = categories.find(cat => 
          cat.subcategories?.some(sub => sub.id === editingVehicle.subcategory_id)
        );
        if (category) setSelectedCategoryId(category.id);
      }
    }
  }, [editingVehicle?.id, categories.length]);

  if (categoriesLoading || formCategoriesLoading) {
    return <Card className="w-full max-w-4xl mx-auto"><CardContent className="p-6"><div className="text-center">A carregar...</div></CardContent></Card>;
  }

  if (categoriesError) {
    return <Card className="w-full max-w-4xl mx-auto"><CardContent className="p-6"><div className="text-center text-red-600">Erro ao carregar categorias.</div></CardContent></Card>;
  }

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
    const mainImageSource = mainImage || mainImageUrl;
    if (!validateVehicleFormTab(currentTab, formData, distanceField, mainImageSource, toast)) return;
    const nextIndex = Math.min(currentTabIndex + 1, tabs.length - 1);
    setCurrentTab(tabs[nextIndex].id);
  };

  const handlePrevious = () => {
    setCurrentTab(tabs[Math.max(currentTabIndex - 1, 0)].id);
  };

  const handleCancel = () => { onCancel ? onCancel() : resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mainImageSource = mainImage || mainImageUrl;
    if (!validateVehicleFormTab(currentTab, formData, distanceField, mainImageSource, toast)) return;

    try {
      if (!isEditMode && submitVehicle) {
        const result = await submitVehicle();
        if (result && onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader><CardTitle>{isEditMode ? "Editar Produto" : "Adicionar Novo Produto"}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => (<TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>))}
            </TabsList>
            <VehicleBasicInfoForm formData={formData} selectedCategoryId={selectedCategoryId} categories={categories}
              availableSubcategories={categories.find(cat => cat.id === selectedCategoryId)?.subcategories || []}
              availableBrands={availableBrands || []} distanceField={distanceField} onInputChange={handleInputChange} onCategoryChange={setSelectedCategoryId} />
            <VehicleSpecsForm formData={formData} onInputChange={handleInputChange} />
            <VehicleImagesForm mainImage={mainImage} mainImageUrl={mainImageUrl} secondaryImages={secondaryImages}
              onMainImageChange={setMainImage} onMainImageUrlChange={setMainImageUrl} onSecondaryImagesChange={setSecondaryImages} />
            <VehicleSettingsForm formData={formData} onInputChange={handleInputChange} />
          </Tabs>
          <VehicleFormNavigation currentTab={currentTab} isFirstTab={isFirstTab} isLastTab={isLastTab}
            isSubmitting={isSubmitting || updateVehicleMutation.isPending} isUploading={isUploading}
            onPrevious={handlePrevious} onCancel={handleCancel} />
        </form>
      </CardContent>
    </Card>
  );
};

export default AddVehicleForm;
