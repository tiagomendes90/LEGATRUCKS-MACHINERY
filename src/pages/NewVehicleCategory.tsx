import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, MapPin, Calendar, Gauge } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import CategorySidebarFilter, { SidebarFilters } from "@/components/CategorySidebarFilter";
import { useVehicles } from "@/hooks/useVehicles";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "react-i18next";
import { getPrimaryImageUrl } from "@/utils/productImages";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  camioes: {
    title: "Camiões Usados e Comerciais em Portugal | Lega",
    description: "Camiões usados e comerciais em Portugal: stock variado de veículos pesados para transporte e logística, com entrega rápida e financiamento disponível.",
  },
  maquinas: {
    title: "Máquinas Industriais e Equipamentos Pesados | Lega",
    description: "Máquinas industriais e equipamentos pesados para construção, obras públicas e indústria. Stock atualizado de máquinas usadas e seminovas em Portugal.",
  },
  tractores: {
    title: "Tractores Agrícolas em Portugal | Lega",
    description: "Tractores agrícolas usados e seminovos em Portugal. Soluções para agricultura, pecuária e exploração florestal com entrega em todo o país.",
  },
  reboques: {
    title: "Reboques Comerciais e Pesados | Lega",
    description: "Reboques comerciais e pesados para transporte de mercadorias, máquinas e veículos. Variedade de tipologias disponíveis em stock na Lega.",
  },
  pecas: {
    title: "Peças para Máquinas e Camiões em Portugal | Lega",
    description: "Peças e componentes para camiões, máquinas, tractores e reboques. Stock alargado de peças novas e usadas com envio para todo o país.",
  },
};

const VEHICLES_PER_PAGE = 12;

// Map URL slug to nav i18n key so category titles follow the active language
const SLUG_TO_NAV_KEY: Record<string, string> = {
  camioes: "nav.trucks",
  maquinas: "nav.machinery",
  tractores: "nav.tractors",
  reboques: "nav.trailers",
  pecas: "nav.parts",
};

const NewVehicleCategory = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const category = location.pathname.substring(1);
  const { data: categories = [] } = useCategories();

  const [filters, setFilters] = useState<SidebarFilters>({
    subcategory: "",
    brand: "",
    condition: "",
    yearFrom: "",
    yearTo: "",
    priceFrom: "",
    priceTo: "",
    sortBy: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const vehicleFilters = useMemo(
    () => ({
      category: category || undefined,
      subcategory: filters.subcategory || undefined,
      brand: filters.brand || undefined,
      condition: filters.condition || undefined,
      yearFrom: filters.yearFrom ? parseInt(filters.yearFrom) : undefined,
      yearTo: filters.yearTo ? parseInt(filters.yearTo) : undefined,
      priceFrom: filters.priceFrom ? parseFloat(filters.priceFrom) : undefined,
      priceTo: filters.priceTo ? parseFloat(filters.priceTo) : undefined,
      sortBy: filters.sortBy || undefined,
    }),
    [category, filters]
  );

  const { data: vehicles, isLoading, error } = useVehicles(vehicleFilters, 200);

  const currentCategory = useMemo(
    () => (categories as any[]).find((cat) => cat.slug === category),
    [categories, category]
  );

  const handleFilterChange = (newFilters: SidebarFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil((vehicles?.length || 0) / VEHICLES_PER_PAGE);
    const startIndex = (currentPage - 1) * VEHICLES_PER_PAGE;
    const endIndex = startIndex + VEHICLES_PER_PAGE;
    const currentVehicles = vehicles?.slice(startIndex, endIndex) || [];
    return { totalPages, startIndex, endIndex, currentVehicles };
  }, [vehicles, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVehicleClick = (vehicle: any) => {
    if (!vehicle?.id) return;
    navigate(`/vehicle/${vehicle.id}`);
  };

  const LoadingSkeleton = () => (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="w-full h-48" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const navKey = SLUG_TO_NAV_KEY[category];
  const categoryTitle = navKey ? t(navKey) : currentCategory?.name || category;
  const categoryDescription = t(`filterPanel.categoryDescriptions.${category}`, {
    defaultValue: t("filterPanel.categoryDescriptions.default"),
  });
  const seo = CATEGORY_SEO[category] || {
    title: `${categoryTitle} | LEGA`,
    description: `Browse ${categoryTitle} available at LEGA — quality stock delivered across Europe.`,
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title={seo.title} description={seo.description} path={`/${category}`} />
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">{t('common.error')}</div>
            <p className="text-gray-600">{t('errors.loadingData')}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalCount = vehicles?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEO title={seo.title} description={seo.description} path={`/${category}`} />
      <Navbar />

      <PageHero title={categoryTitle} subtitle={categoryDescription} />

      {/* Main: sidebar + grid */}
      <section className="py-6 flex-1">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop sidebar */}
            <div className="hidden lg:block lg:w-[300px] flex-shrink-0">
              <div className="sticky top-24">
                <CategorySidebarFilter
                  category={category}
                  filters={filters}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            {/* Mobile filters trigger */}
            <div className="lg:hidden flex items-center justify-between">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t("filterPanel.filtersButton")}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[90%] sm:w-[380px] overflow-y-auto p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>{t("filterPanel.filtersButton")}</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <CategorySidebarFilter
                      category={category}
                      filters={filters}
                      onChange={handleFilterChange}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <span className="text-sm text-gray-600">
                {t("filterPanel.vehiclesAvailable", { count: totalCount })}
              </span>
            </div>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <LoadingSkeleton />
              ) : vehicles && vehicles.length > 0 ? (
                <>
                  <div className="mb-4 hidden lg:flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {t("category.showing", {
                        start: Math.min(paginationData.startIndex + 1, totalCount),
                        end: Math.min(paginationData.endIndex, totalCount),
                        total: totalCount,
                      })}
                    </p>
                    <p className="text-sm font-semibold text-orange-600">
                      {t("filterPanel.vehiclesAvailable", { count: totalCount })}
                    </p>
                  </div>
                {(() => {
                  const count = paginationData.currentVehicles.length;
                  const gridClass =
                    count === 1
                      ? "grid grid-cols-1 gap-6 mb-8"
                      : count <= 3
                      ? "grid sm:grid-cols-2 gap-6 mb-8"
                      : "grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8";
                  const aspectClass =
                    count === 1 ? "aspect-[16/9]" : "aspect-[4/3]";
                  const titleClass =
                    count === 1
                      ? "text-2xl md:text-3xl leading-tight line-clamp-2 min-h-0"
                      : "text-lg leading-snug line-clamp-2 min-h-[3rem]";
                  const priceClass =
                    count === 1 ? "text-3xl md:text-4xl" : "text-2xl";
                  return (
                  <div className={gridClass}>
                    {paginationData.currentVehicles.map((vehicle: any) => {
                      const mileage = vehicle.mileage ?? vehicle.km;
                      const hours = vehicle.operating_hours ?? vehicle.hours;
                      const location = [vehicle.location_city, vehicle.location_country]
                        .filter(Boolean)
                        .join(", ");
                      return (
                      <Card
                        key={vehicle.id}
                        className="group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col border-gray-200"
                        onClick={() => handleVehicleClick(vehicle)}
                      >
                        <div className={`relative overflow-hidden ${aspectClass} bg-gray-100`}>
                          <img
                            src={
                              getPrimaryImageUrl(vehicle.images) ||
                              "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=900&h=600&fit=crop"
                            }
                            alt={vehicle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {vehicle.condition && (
                            <Badge className="absolute top-3 right-3 bg-orange-500 hover:bg-orange-500 text-white font-semibold uppercase text-[10px] tracking-wider">
                              {t(`filterPanel.${vehicle.condition}`, { defaultValue: vehicle.condition }) as string}
                            </Badge>
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                            <span>{vehicle.brand?.name || ""}</span>
                            {vehicle.year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {vehicle.year}
                              </span>
                            )}
                          </div>
                          <CardTitle className={`${titleClass} text-gray-900`}>
                            {vehicle.title}
                          </CardTitle>
                          <div className={`${priceClass} font-bold text-orange-600 mt-1`}>
                            {vehicle.price
                              ? `€${Number(vehicle.price).toLocaleString()}`
                              : t("featured.onRequest")}
                          </div>
                        </CardHeader>
                        <CardContent className="mt-auto pt-0 pb-4">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-3 min-h-5">
                            {mileage && (
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3.5 w-3.5" />
                                {Number(mileage).toLocaleString()} km
                              </span>
                            )}
                            {hours && (
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3.5 w-3.5" />
                                {Number(hours).toLocaleString()} h
                              </span>
                            )}
                            {location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {location}
                              </span>
                            )}
                          </div>
                          <Button
                            className="w-full bg-slate-900 hover:bg-orange-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVehicleClick(vehicle);
                            }}
                          >
                            {t("common.viewDetails")}
                          </Button>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>);
                })()}

                  {paginationData.totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(page);
                                }}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < paginationData.totalPages)
                                handlePageChange(currentPage + 1);
                            }}
                            className={
                              currentPage === paginationData.totalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-lg">
                  <p className="text-gray-700 text-lg mb-2">{t("category.noVehicles")}</p>
                  <p className="text-gray-500">{t("category.adjustFilters")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default NewVehicleCategory;
