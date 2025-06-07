
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const WhatsAppFloat = () => {
  // Call all hooks at the top level, before any returns
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Only check scroll position on homepage
      if (location.pathname === "/") {
        // Hero section is typically full viewport height (100vh)
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        
        // Show WhatsApp button after scrolling past 80% of viewport height
        setIsScrolledPastHero(scrollY > viewportHeight * 0.8);
      } else {
        // On other pages, always show the button
        setIsScrolledPastHero(true);
      }
    };

    // Set initial state
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Only show on mobile devices - moved after all hooks
  if (!isMobile) return null;

  // Hide on homepage when not scrolled past hero, and hide on contact/admin pages
  const shouldHide = (location.pathname === "/" && !isScrolledPastHero) || 
                    location.pathname === "/contact" || 
                    location.pathname === "/admin";

  if (shouldHide) return null;

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
