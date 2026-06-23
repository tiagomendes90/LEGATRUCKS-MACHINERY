
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Phone, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import ContactVehicleModal from "./ContactVehicleModal";
import { Vehicle } from "@/hooks/useVehicles";
import { openWhatsApp } from "@/lib/whatsapp";
import { getPrimaryImageUrl } from "@/utils/productImages";

interface VehicleActionsProps {
  vehicle: Vehicle;
}

const VehicleActions = ({ vehicle }: VehicleActionsProps) => {
  const { t } = useTranslation();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleWhatsAppClick = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const message = `Olá! Tenho interesse no veículo "${vehicle.title}".\n${url}`;
    openWhatsApp(message);
  };

  const handleCallClick = () => {
    window.location.href = "tel:+351912406089";
  };

  const handleShareClick = () => {
    const shareData: ShareData = {
      title: vehicle.title,
      text: `${vehicle.title}${vehicle.price ? ` - €${vehicle.price.toLocaleString()}` : ""}`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard && shareData.url) {
      navigator.clipboard.writeText(shareData.url).catch(() => {});
    }
  };

  const handleContactClick = () => { setIsContactModalOpen(true); };

  return (
    <>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Interessado neste veículo?
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={handleWhatsAppClick} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
          <MessageCircle className="h-5 w-5 mr-2" />
          WhatsApp
        </Button>
        <Button onClick={handleCallClick} size="lg" className="w-full bg-primary hover:bg-primary/90">
          <Phone className="h-5 w-5 mr-2" />
          Ligar Agora
        </Button>
        <Button onClick={handleContactClick} variant="outline" size="lg" className="w-full">
          <Send className="h-5 w-5 mr-2" />
          Enviar Mensagem
        </Button>
        <Button onClick={handleShareClick} variant="outline" size="lg" className="w-full">
          <Share2 className="h-5 w-5 mr-2" />
          Partilhar
        </Button>
      </div>
      <ContactVehicleModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} vehicle={vehicle} />
    </>
  );
};

export default VehicleActions;
