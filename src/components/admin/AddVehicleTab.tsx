
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import VehicleBasicInfoForm from "./VehicleBasicInfoForm";
import VehicleSpecificationsForm from "@/components/VehicleSpecificationsForm";
import VehicleMediaForm from "./VehicleMediaForm";
import { Truck } from "@/hooks/useTrucks";
import { VehicleSpecifications } from "@/hooks/useVehicleSpecifications";

interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  price: string;
  condition: string;
  engine: string;
  transmission: string;
  description: string;
  horsepower: string;
  category: string;
  subcategory: string;
  features: string[];
  images: string[];
}

interface VehicleMedia {
  coverImage: string;
  images: string[];
  videos: string[];
}

interface AddVehicleTabProps {
  newTruck: VehicleFormData;
  setNewTruck: React.Dispatch<React.SetStateAction<VehicleFormData>>;
  vehicleSpecifications: Partial<VehicleSpecifications>;
  setVehicleSpecifications: React.Dispatch<React.SetStateAction<Partial<VehicleSpecifications>>>;
  vehicleMedia: VehicleMedia;
  setVehicleMedia: React.Dispatch<React.SetStateAction<VehicleMedia>>;
  onAddTruck: () => void;
  isEditMode: boolean;
  editingTruck: Truck | null;
  onResetForm: () => void;
  isLoading: boolean;
}

const AddVehicleTab = ({
  newTruck,
  setNewTruck,
  vehicleSpecifications,
  setVehicleSpecifications,
  vehicleMedia,
  setVehicleMedia,
  onAddTruck,
  isEditMode,
  editingTruck,
  onResetForm,
  isLoading
}: AddVehicleTabProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeAddTruckTab, setActiveAddTruckTab] = useState("basic-info");
  const [isFormValid, setIsFormValid] = useState({ step1: false, step2: true, step3: true });

  // Validate form steps
  useEffect(() => {
    const step1Valid = newTruck.brand && newTruck.model && newTruck.year && newTruck.price && 
                     newTruck.condition && newTruck.description && newTruck.category;
    const step3Valid = vehicleMedia.coverImage && vehicleMedia.images.length > 0;
    
    setIsFormValid({
      step1: !!step1Valid,
      step2: true,
      step3: !!step3Valid
    });
  }, [newTruck, vehicleMedia]);

  const handleNextStep = () => {
    if (currentStep === 1 && !isFormValid.step1) {
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setActiveAddTruckTab(currentStep === 1 ? "specifications" : "media");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setActiveAddTruckTab(currentStep === 2 ? "basic-info" : "specifications");
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">{t('admin.basicInfo')}</span>
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">{t('admin.specifications')}</span>
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">{t('admin.photosVideos')}</span>
            </div>
          </div>
          {isEditMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 font-medium">
                Editing: {editingTruck?.brand} {editingTruck?.model} ({editingTruck?.year})
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onResetForm}
                className="mt-2"
              >
                Cancel Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeAddTruckTab} onValueChange={setActiveAddTruckTab} className="space-y-6">
        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: {t('admin.basicInfo')}</CardTitle>
              <CardDescription>Add basic vehicle information</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleBasicInfoForm
                newTruck={newTruck}
                setNewTruck={setNewTruck}
                onNext={handleNextStep}
                isFormValid={isFormValid.step1}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: {t('admin.specifications')}</CardTitle>
              <CardDescription>Add detailed technical specifications (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleSpecificationsForm
                specifications={vehicleSpecifications}
                onSpecificationsChange={setVehicleSpecifications}
              />
              <div className="mt-6 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back: Basic Info
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                >
                  Next: Media
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: {t('admin.photosVideos')}</CardTitle>
              <CardDescription>Add cover image, additional photos (max 25), and videos (max 3)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <VehicleMediaForm
                vehicleMedia={vehicleMedia}
                setVehicleMedia={setVehicleMedia}
              />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back: Specifications
                </Button>
                <Button 
                  onClick={onAddTruck}
                  disabled={isLoading || !isFormValid.step1 || !isFormValid.step3}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? 
                    (isEditMode ? 'Updating Vehicle...' : 'Adding Vehicle...') : 
                    (isEditMode ? 'Update Vehicle' : 'Add Vehicle')
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddVehicleTab;
