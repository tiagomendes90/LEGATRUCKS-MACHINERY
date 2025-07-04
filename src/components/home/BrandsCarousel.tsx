
import { useNewVehicleBrands } from "@/hooks/useNewVehicleBrands";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const BrandsCarousel = () => {
  const { data: brands = [], isLoading } = useNewVehicleBrands();

  if (isLoading) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!brands.length) {
    return null;
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Trusted Brands</h2>
          <p className="text-gray-600">We work with the most reliable vehicle manufacturers</p>
        </div>
        
        <div className="relative max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 2000,
                stopOnInteraction: false,
                stopOnMouseEnter: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {brands.map((brand) => (
                <CarouselItem key={brand.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                  <div className="text-center group cursor-pointer">
                    <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-shadow border-2 border-gray-100">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm text-gray-700 group-hover:text-primary transition-colors">
                      {brand.name}
                    </h3>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default BrandsCarousel;
