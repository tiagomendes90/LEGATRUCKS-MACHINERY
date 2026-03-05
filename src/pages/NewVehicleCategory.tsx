import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewVehicleFilter from "@/components/NewVehicleFilter";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useVehicles, VehicleFilters } from "@/hooks/useVehicles";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "react-i18next";

const VEHICLES_PER_PAGE = 12;

const NewVehicleCategory = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const category = location.pathname.substring(1);
  const { data: categories = [] } = useCategories();
  
  const [filters, setFilters] = useState({
    brand: '',
    subcategory: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
    condition: '',
    fuelType: '',
    search: '',
    mileageMax: '',
    operatingHoursMax: '',
    gearbox: '',
    drivetrain: '',
    axles: '',
    powerPs: '',
    weightKg: '',
    bodyColor: '',
    sortBy: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  const vehicleFilters = React.useMemo(() => ({
    category: category || undefined,
    subcategory: filters.subcategory || undefined,
    brand: filters.brand || undefined,
    condition: filters.condition || undefined,
    yearFrom: filters.yearFrom ? parseInt(filters.yearFrom) : undefined,
    yearTo: filters.yearTo ? parseInt(filters.yearTo) : undefined,
    priceFrom: filters.priceFrom ? parseFloat(filters.priceFrom) : undefined,
    priceTo: filters.priceTo ? parseFloat(filters.priceTo) : undefined,
  }), [category, filters]);

  const { data: vehicles, isLoading, error } = useVehicles(vehicleFilters);

  // Get category info from DB
  const currentCategory = useMemo(() => {
    return (categories as any[]).find(cat => cat.slug === category);
  }, [categories, category]);

  const handleFilterChange = (newFilters: typeof filters) => {
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
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="w-full h-48" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const categoryTitle = currentCategory?.name || category;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <section className="relative py-[150px] bg-slate-800">
          <div className="relative z-10 container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{categoryTitle}</h1>
          </div>
        </section>
        <section className="py-16">
          <div className="container mx-auto px-6"><LoadingSkeleton /></div>
        </section>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">{t('common.error')}</div>
            <p className="text-gray-600">Problema ao carregar os dados.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <section className="relative py-[150px] bg-slate-800">
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{categoryTitle}</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <NewVehicleFilter 
            category={category}
            filters={filters}
            onFiltersChange={handleFilterChange}
            onSearch={() => {}}
            totalCount={vehicles?.length || 0}
            brands={[]}
          />

          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              {t('category.showing', { 
                start: Math.min(paginationData.startIndex + 1, vehicles?.length || 0), 
                end: Math.min(paginationData.endIndex, vehicles?.length || 0), 
                total: vehicles?.length || 0
              })}
            </p>
          </div>

          {vehicles && vehicles.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {paginationData.currentVehicles.map((vehicle: any) => (
                  <Card key={vehicle.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                        onClick={() => handleVehicleClick(vehicle)}>
                    <div className="relative overflow-hidden">
                      <img 
                        src={vehicle.images?.[0]?.image_url || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop"} 
                        alt={vehicle.title} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <Badge className="absolute top-4 left-4 bg-blue-600">
                        {vehicle.subcategory?.name || 'Produto'}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{vehicle.title}</CardTitle>
                      <CardDescription className="text-2xl font-bold text-orange-600">
                        €{(vehicle.price || 0).toLocaleString()}
                      </CardDescription>
                      <div className="text-sm text-gray-500">
                        {vehicle.year && `${vehicle.year} • `}{vehicle.condition}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-slate-800 hover:bg-slate-700"
                                onClick={(e) => { e.stopPropagation(); handleVehicleClick(vehicle); }}>
                          {t('common.viewDetails')}
                        </Button>
                        <Button variant="outline" 
                                className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); }}>
                          {t('common.contact')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {paginationData.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
                    </PaginationItem>
                    {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page); }} isActive={currentPage === page}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < paginationData.totalPages) handlePageChange(currentPage + 1); }}
                        className={currentPage === paginationData.totalPages ? "pointer-events-none opacity-50" : ""} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">{t('category.noVehicles')}</p>
              <p className="text-gray-400 mb-4">{t('category.adjustFilters')}</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default NewVehicleCategory;
