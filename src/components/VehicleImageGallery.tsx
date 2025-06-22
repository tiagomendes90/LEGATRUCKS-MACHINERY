
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage, getImageSizeKB } from "@/utils/imageCompression";

interface VehicleImageGalleryProps {
  images: string[];
  vehicleName: string;
}

const VehicleImageGallery = ({ images, vehicleName }: VehicleImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [optimizedImages, setOptimizedImages] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const validImages = images && images.length > 0 ? images : ["https://via.placeholder.com/800x600"];

  // Optimize images when component mounts
  useEffect(() => {
    const optimizeImages = async () => {
      if (validImages.length === 1 && validImages[0].includes('placeholder')) {
        setOptimizedImages(validImages);
        return;
      }

      setIsOptimizing(true);
      try {
        const compressed = await Promise.all(
          validImages.map(async (image) => {
            if (image.startsWith('data:')) {
              const originalSize = getImageSizeKB(image);
              // Only compress if image is larger than 200KB
              if (originalSize > 200) {
                const compressedImage = await compressImage(image, {
                  maxWidth: 800,
                  maxHeight: 600,
                  quality: 0.75,
                  maxSizeKB: 200
                });
                const compressedSize = getImageSizeKB(compressedImage);
                console.log(`Image optimized: ${originalSize.toFixed(1)}KB -> ${compressedSize.toFixed(1)}KB`);
                return compressedImage;
              }
            }
            return image;
          })
        );
        setOptimizedImages(compressed);
      } catch (error) {
        console.error('Failed to optimize images:', error);
        setOptimizedImages(validImages);
      } finally {
        setIsOptimizing(false);
      }
    };

    optimizeImages();
  }, [validImages]);

  const displayImages = optimizedImages.length > 0 ? optimizedImages : validImages;

  const goToPrevious = () => {
    setSelectedImageIndex(prev => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setSelectedImageIndex(prev => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        {isOptimizing && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="bg-white px-3 py-1 rounded text-sm">
              Otimizando imagens...
            </div>
          </div>
        )}
        <img
          src={displayImages[selectedImageIndex]}
          alt={`${vehicleName} - Imagem ${selectedImageIndex + 1}`}
          className="w-full h-96 lg:h-[500px] object-cover"
          loading="lazy"
        />
        
        {/* Navigation Arrows - Only show if multiple images */}
        {displayImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Carousel - Only show if multiple images */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImageIndex 
                  ? 'border-primary shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${vehicleName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleImageGallery;
