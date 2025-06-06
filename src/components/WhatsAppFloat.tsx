
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const WhatsAppFloat = () => {
  const isMobile = useIsMobile();

  // Only show on mobile devices
  if (!isMobile) return null;

  const handleWhatsAppClick = () => {
    // Replace with your actual WhatsApp number
    const phoneNumber = "351123456789";
    const message = "Hello! I'm interested in your trucks and machinery.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default WhatsAppFloat;
