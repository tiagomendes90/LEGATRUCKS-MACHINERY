
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Share2, Printer, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import ContactVehicleModal from "./ContactVehicleModal";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleActionsProps {
  vehicle: Vehicle;
}

const VehicleActions = ({ vehicle }: VehicleActionsProps) => {
  const { t } = useTranslation();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleCallClick = () => {
    window.location.href = `tel:${'351123456789'}`;
  };

  const handleMailClick = () => {
    window.location.href = `mailto:${'info@legar.pt'}?subject=Interesse em ${vehicle.title}&body=Olá, tenho interesse no veículo ${vehicle.title} (€${vehicle.price_eur.toLocaleString()}).`;
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: vehicle.title,
        text: `Confira este veículo: ${vehicle.title} - €${vehicle.price_eur.toLocaleString()}`,
        url: window.location.href,
      })
      .then(() => console.log('Partilha bem-sucedida'))
      .catch((error) => console.error('Erro ao partilhar', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handlePrintClick = () => {
    window.print();
  };

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={handleContactClick} size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
          <MessageCircle className="h-5 w-5 mr-2" />
          {t('vehicleDetails.contactSeller', 'Contactar Vendedor')}
        </Button>
        <Button onClick={handleCallClick} size="lg" className="w-full">
          <Phone className="h-5 w-5 mr-2" />
          {t('vehicleDetails.callNow')}
        </Button>
        <Button onClick={handleMailClick} variant="outline" size="lg" className="w-full">
          <Mail className="h-5 w-5 mr-2" />
          {t('vehicleDetails.sendEmail')}
        </Button>
        <Button onClick={handleShareClick} variant="outline" size="lg" className="w-full">
          <Share2 className="h-5 w-5 mr-2" />
          {t('vehicleDetails.shareVehicle')}
        </Button>
      </div>
      
      <div className="mt-4 grid grid-cols-1 gap-2">
        <Button onClick={handlePrintClick} variant="outline" size="sm" className="w-full">
          <Printer className="h-5 w-5 mr-2" />
          {t('vehicleDetails.printDetails')}
        </Button>
      </div>

      <ContactVehicleModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        vehicle={vehicle}
      />
    </>
  );
};

export default VehicleActions;
