
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface VehicleImageGalleryProps {
  images: string[];
  vehicleName: string;
}

const VehicleImageGallery = ({ images, vehicleName }: VehicleImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t } = useTranslation();

  const validImages = images && images.length > 0 ? images : ["https://via.placeholder.com/800x600"];

  const goToPrevious = useCallback(() => {
    setSelectedImageIndex(prev =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    setSelectedImageIndex(prev =>
      prev === validImages.length - 1 ? 0 : prev + 1
    );
  }, [validImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen, goToPrevious, goToNext]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  return (
    <>
      <div className="space-y-4">
        {/* Main Image with zoom hover */}
        <div
          className="relative group cursor-zoom-in rounded-xl overflow-hidden bg-muted"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={validImages[selectedImageIndex]}
            alt={`${vehicleName} - ${selectedImageIndex + 1}`}
            className="w-full h-[400px] lg:h-[520px] object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Zoom icon overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <ZoomIn className="h-10 w-10 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-300 drop-shadow-lg" />
          </div>

          {/* Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {selectedImageIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {validImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === selectedImageIndex
                    ? 'border-primary shadow-md ring-2 ring-primary/30'
                    : 'border-border hover:border-muted-foreground/40 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={image}
                  alt={`${vehicleName} - ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-5 right-5 text-white/80 hover:text-white z-50 p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-7 w-7" />
          </button>

          {/* Counter */}
          {validImages.length > 1 && (
            <div className="absolute top-6 left-6 text-white/70 text-sm font-medium">
              {selectedImageIndex + 1} / {validImages.length}
            </div>
          )}

          {/* Main image */}
          <img
            src={validImages[selectedImageIndex]}
            alt={`${vehicleName} - ${selectedImageIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation arrows */}
          {validImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Fullscreen thumbnails */}
          {validImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-2">
              {validImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex
                      ? 'border-white shadow-lg'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VehicleImageGallery;
