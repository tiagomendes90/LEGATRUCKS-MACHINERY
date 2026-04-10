
import { useNewVehicleBrands } from "@/hooks/useNewVehicleBrands";
import { Skeleton } from "@/components/ui/skeleton";

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

const INVALID_SLUGS = new Set(["trailers", "", "sdc"]);

const BrandsCarousel = () => {
  const { data: brands = [], isLoading } = useNewVehicleBrands();

  // Filter invalid, deduplicate by logo path, require a logo
  const validBrands = brands.filter((brand) => {
    if (!brand || !brand.slug || INVALID_SLUGS.has(brand.slug.toLowerCase())) return false;
    if (!brandLogos[brand.slug]) return false;
    return true;
  });

  const uniqueBrands = validBrands.filter((brand, index, self) => {
    const logo = brandLogos[brand.slug];
    return index === self.findIndex((b) => brandLogos[b.slug] === logo);
  });

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
              <Skeleton key={i} className="h-16 w-28" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!uniqueBrands.length) return null;

  // Double the list for seamless infinite scroll
  const marqueeItems = [...uniqueBrands, ...uniqueBrands];

  return (
    <div className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3 text-foreground">Trusted Brands</h2>
          <p className="text-muted-foreground">We work with the most reliable vehicle manufacturers</p>
        </div>

        <div className="relative max-w-6xl mx-auto overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-muted/30 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-muted/30 to-transparent" />

          <div
            className="flex items-center gap-12 w-max animate-marquee hover:[animation-play-state:paused]"
          >
            {marqueeItems.map((brand, index) => (
              <div
                key={`${brand.id}-${index}`}
                className="flex-shrink-0 flex items-center justify-center h-28 w-[140px] group cursor-pointer"
              >
                <img
                  src={brandLogos[brand.slug]}
                  alt={brand.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-20 w-auto max-w-[140px] object-contain object-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandsCarousel;
