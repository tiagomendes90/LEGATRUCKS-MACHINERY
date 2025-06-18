
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTrucks } from "@/hooks/useTrucks";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import VehicleImageGallery from "@/components/VehicleImageGallery";
import VehicleInfo from "@/components/VehicleInfo";
import VehicleActions from "@/components/VehicleActions";
import SimilarVehicles from "@/components/SimilarVehicles";
import { useTranslation } from "react-i18next";

const VehicleDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: allTrucks, isLoading, error } = useTrucks();

  const vehicle = allTrucks?.find(truck => truck.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">
            {t('common.error')}: {error?.message || 'Veículo não encontrado'}
          </div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  const similarVehicles = allTrucks
    ?.filter(truck => truck.category === vehicle.category && truck.id !== vehicle.id)
    .slice(0, 3);

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Product Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-600 text-white py-16 mt-20">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-xl lg:text-2xl text-slate-200">
              {vehicle.subcategory || vehicle.category} • {vehicle.year}
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={handleBackClick}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Images */}
          <div>
            <VehicleImageGallery 
              images={vehicle.images || []} 
              vehicleName={`${vehicle.brand} ${vehicle.model}`}
            />
          </div>

          {/* Right Column - Vehicle Info */}
          <div className="space-y-8">
            <VehicleInfo vehicle={vehicle} />
            <VehicleActions />
          </div>
        </div>

        {/* Similar Vehicles */}
        <SimilarVehicles vehicles={similarVehicles || []} />
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default VehicleDetails;
