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
import { SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import CategorySidebarFilter, { SidebarFilters } from "@/components/CategorySidebarFilter";
import { useVehicles } from "@/hooks/useVehicles";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  camioes: {
    title: "Used Trucks for Sale | LEGA",
    description: "Browse LEGA's selection of quality used trucks available for immediate delivery across Europe.",
  },
  maquinas: {
    title: "Construction Machinery for Sale | LEGA",
    description: "Explore LEGA's range of used construction and industrial machinery available across Europe.",
  },
  tractores: {
    title: "Used Tractors for Sale | LEGA",
    description: "Discover LEGA's selection of used agricultural tractors, ready for delivery across Europe.",
  },
  reboques: {
    title: "Trailers for Sale | LEGA",
    description: "Browse LEGA's range of trailers for trucks and transport, available across Europe.",
  },
  pecas: {
    title: "Truck & Machinery Parts | LEGA",
    description: "Quality parts and components for trucks, machinery, trailers and tractors — in stock at LEGA.",
  },
};

const VEHICLES_PER_PAGE = 12;

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

  const categoryTitle = currentCategory?.name || category;
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

      {/* Slim category header */}
      <section className="bg-white border-b border-gray-200 pt-24 pb-6">
        <div className="container mx-auto px-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-tight">
            {categoryTitle}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 max-w-2xl">
            {categoryDescription}
          </p>
          <p className="text-sm font-medium text-orange-600 mt-2">
            {t("filterPanel.vehiclesAvailable", { count: totalCount })}
          </p>
        </div>
      </section>

      {/* Main: sidebar + grid */}
      <section className="py-8 flex-1">
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
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {paginationData.currentVehicles.map((vehicle: any) => (
                      <Card
                        key={vehicle.id}
                        className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer flex flex-col"
                        onClick={() => handleVehicleClick(vehicle)}
                      >
                        <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
                          <img
                            src={
                              vehicle.images?.[0]?.image_url ||
                              "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop"
                            }
                            alt={vehicle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            width={500}
                            height={375}
                          />
                          {vehicle.subcategory?.name && (
                            <Badge className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-600">
                              {vehicle.subcategory.name}
                            </Badge>
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            {vehicle.brand?.name || ""}
                          </div>
                          <CardTitle className="text-lg leading-snug line-clamp-2 min-h-[3rem]">
                            {vehicle.title}
                          </CardTitle>
                          <div className="text-xl font-bold text-orange-600">
                            {vehicle.price
                              ? `€${Number(vehicle.price).toLocaleString()}`
                              : t("featured.onRequest")}
                          </div>
                          <div className="text-xs text-gray-500 flex gap-2">
                            {vehicle.year && <span>{vehicle.year}</span>}
                            {vehicle.condition && (
                              <>
                                <span>•</span>
                                <span className="capitalize">
                                  {t(`filterPanel.${vehicle.condition}`, vehicle.condition)}
                                </span>
                              </>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="mt-auto pt-2">
                          <Button
                            className="w-full bg-slate-800 hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVehicleClick(vehicle);
                            }}
                          >
                            {t("common.viewDetails")}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

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
