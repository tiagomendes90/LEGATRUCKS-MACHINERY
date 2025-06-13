
import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Share2, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";

const VehicleActions = () => {
  const { t } = useTranslation();

  const handleCallClick = () => {
    window.location.href = `tel:${'351123456789'}`;
  };

  const handleMailClick = () => {
    window.location.href = `mailto:${'info@legar.pt'}`;
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: "Confira este veículo interessante",
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <Button onClick={handlePrintClick} variant="outline" size="lg" className="w-full">
        <Printer className="h-5 w-5 mr-2" />
        {t('vehicleDetails.printDetails')}
      </Button>
    </div>
  );
};

export default VehicleActions;
