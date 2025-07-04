
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useVehicleForm } from "@/hooks/useVehicleForm";
import { VehicleBasicInfoForm } from "./vehicle-form/VehicleBasicInfoForm";
import { VehicleSpecsForm } from "./vehicle-form/VehicleSpecsForm";
import { VehicleImagesForm } from "./vehicle-form/VehicleImagesForm";
import { VehicleSettingsForm } from "./vehicle-form/VehicleSettingsForm";
import { VehicleFormNavigation } from "./vehicle-form/VehicleFormNavigation";
import { validateVehicleFormTab } from "./vehicle-form/VehicleFormValidation";

export const AddVehicleForm = () => {
  const { toast } = useToast();
  const {
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
  } = useVehicleForm();

  const distanceField = getDistanceFieldInfo();

  // Tab navigation logic
  const tabs = ["basic", "specs", "images", "settings"];
  const getCurrentTabIndex = () => tabs.indexOf(currentTab);
  const isLastTab = () => getCurrentTabIndex() === tabs.length - 1;
  const isFirstTab = () => getCurrentTabIndex() === 0;

  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1]);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
    }
  };

  const handleNextOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateVehicleFormTab(currentTab, formData, distanceField, mainImage, toast)) {
      return;
    }
    
    if (isLastTab()) {
      await submitVehicle();
    } else {
      goToNextTab();
    }
  };

  if (categoriesLoading || brandsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">A carregar formulário...</div>
      </div>
    );
  }

  if (brandsError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Erro ao carregar marcas</div>
          <p className="text-gray-600">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Adicionar Novo Veículo</CardTitle>
        <CardDescription>
          Preencha os detalhes do veículo - as imagens serão otimizadas automaticamente via ImageKit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleNextOrSubmit} className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="specs">Especificações</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <VehicleBasicInfoForm
              formData={formData}
              selectedCategoryId={selectedCategoryId}
              categories={categories}
              availableSubcategories={availableSubcategories}
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
            isFirstTab={isFirstTab()}
            isLastTab={isLastTab()}
            isSubmitting={isSubmitting}
            isUploading={isUploading}
            onPrevious={goToPreviousTab}
            onCancel={() => window.location.reload()}
          />
        </form>
      </CardContent>
    </Card>
  );
};
