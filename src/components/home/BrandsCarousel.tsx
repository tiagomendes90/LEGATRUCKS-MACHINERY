
import { useNewVehicleBrands } from "@/hooks/useNewVehicleBrands";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const brandLogos: Record<string, string> = {
  "bosch": "/logos/bosch.png",
  "case-ih": "/logos/case-ih.png",
  "caterpillar": "/logos/caterpillar.png",
  "claas": "/logos/claas.png",
  "daf": "/logos/daf.png",
  "doosan": "/logos/doosan.png",
  "fendt": "/logos/fendt.png",
  "hitachi": "/logos/hitachi.png",
  "iveco": "/logos/iveco.png",
  "jcb": "/logos/jcb.png",
  "john-deere": "/logos/john-deere.png",
  "knorr-bremse": "/logos/knorr-bremse.png",
  "kogel": "/logos/kogel.png",
  "komatsu": "/logos/komatsu.png",
  "krone": "/logos/krone.png",
  "kubota": "/logos/kubota.png",
  "liebherr": "/logos/liebherr.png",
  "man-trucks": "/logos/man-trucks.png",
  "massey-ferguson": "/logos/massey-ferguson.png",
  "mercedes-trucks": "/logos/mercedes-trucks.png",
  "new-holland-agri": "/logos/new-holland-agri.png",
  "renault-trucks": "/logos/renault-trucks.png",
  "sany": "/logos/sany.png",
  "scania": "/logos/scania.png",
  "schmitz": "/logos/schmitz.png",
  "schwarzmuller": "/logos/schwarzmuller.png",
  "sdc": "/logos/sdc.png",
  "valtra": "/logos/valtra.png",
  "volvo-construction": "/logos/volvo.png",
  "volvo-trucks": "/logos/volvo.png",
  "wabco": "/logos/wabco.png",
  "wielton": "/logos/wielton.png",
  "xcmg": "/logos/xcmg.png",
  "zf": "/logos/zf.png",
};

const BrandsCarousel = () => {
  const { data: brands = [], isLoading } = useNewVehicleBrands();

  if (isLoading) {
    return (
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="flex gap-10 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-24" />
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
    <div className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3 text-foreground">Trusted Brands</h2>
          <p className="text-muted-foreground">We work with the most reliable vehicle manufacturers</p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 2000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {brands.map((brand) => {
                const logoSrc = brandLogos[brand.slug];
                return (
                  <CarouselItem
                    key={brand.id}
                    className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                  >
                    <div className="flex items-center justify-center px-2 py-4 group cursor-pointer">
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={brand.name}
                          loading="lazy"
                          width={512}
                          height={512}
                          className="h-10 md:h-12 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground/60 group-hover:text-foreground transition-colors duration-300 whitespace-nowrap">
                          {brand.name}
                        </span>
                      )}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default BrandsCarousel;
