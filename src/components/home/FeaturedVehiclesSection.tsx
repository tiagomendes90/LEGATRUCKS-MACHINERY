
import { useFeaturedVehicles } from "@/hooks/useFeaturedVehicles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

const FeaturedVehiclesSection = () => {
  const { data: featuredProducts = [], isLoading } = useFeaturedVehicles();
  const navigate = useNavigate();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
      dragFree: false,
      containScroll: false,
    },
    [
      Autoplay({
        delay: 4500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-56 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!featuredProducts.length) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
            <p className="text-muted-foreground mb-8">Nenhum produto em destaque de momento</p>
          </div>
        </div>
      </div>
    );
  }

  const slides = featuredProducts.slice(0, 9);
  const totalSlides = slides.length;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">Produtos em Destaque</h2>
          <p className="text-muted-foreground text-lg">Selecionados especialmente para si</p>
        </div>

        <div className="relative group">
          {/* Navigation Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110 disabled:opacity-0"
            disabled={!canScrollPrev}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110 disabled:opacity-0"
            disabled={!canScrollNext}
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {slides.map((item: any, index: number) => {
                const product = item.product;
                if (!product) return null;

                const isActive = index === selectedIndex;

                return (
                  <div
                    key={item.id}
                    className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3 pl-4"
                  >
                    <div
                      className={`transition-all duration-500 ${
                        isActive ? "scale-100" : "scale-[0.97]"
                      }`}
                    >
                      <Card
                        className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl ${
                          isActive ? "shadow-lg ring-1 ring-primary/20" : "shadow-sm"
                        }`}
                        onClick={() => navigate(`/vehicle/${product.id}`)}
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={
                              product.images?.[0]?.image_url ||
                              "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=400&h=280&fit=crop"
                            }
                            alt={product.title}
                            className="w-full h-56 object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                          />
                          <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground shadow-md">
                            Destaque
                          </Badge>
                          {product.condition && (
                            <Badge
                              variant="secondary"
                              className="absolute top-3 left-3 shadow-md"
                            >
                              {product.condition === "new" ? "Novo" : "Usado"}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                            {product.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {product.brand?.name}
                            {product.year && ` • ${product.year}`}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xl font-bold text-primary">
                              {product.price
                                ? `€${product.price.toLocaleString()}`
                                : "Sob consulta"}
                            </p>
                            <Button size="sm" variant="outline">
                              Ver Detalhes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots */}
          {totalSlides > 3 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === selectedIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedVehiclesSection;
