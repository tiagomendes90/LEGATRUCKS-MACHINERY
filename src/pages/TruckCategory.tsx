
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TruckFilter from "@/components/TruckFilter";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useTrucks } from "@/hooks/useTrucks";
import { useTranslation } from "react-i18next";

const TRUCKS_PER_PAGE = 12;

const TruckCategory = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract category from pathname
  const category = location.pathname.substring(1);
  
  // Fetch trucks directly with category filter for better performance
  const { data: trucks, isLoading, error } = useTrucks(category);
  
  const [displayTrucks, setDisplayTrucks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  console.log('Current category:', category);
  console.log('Trucks loaded:', trucks?.length || 0);

  // Memoize category data to prevent unnecessary re-renders
  const categoryData = useMemo(() => ({
    "trucks": {
      title: t('category.trucks.title'),
      description: t('category.trucks.description')
    },
    "machinery": {
      title: t('category.machinery.title'), 
      description: t('category.machinery.description')
    },
    "agriculture": {
      title: t('category.agriculture.title'),
      description: t('category.agriculture.description')
    }
  }), [t]);

  const data = categoryData[category as keyof typeof categoryData];

  // Set trucks when data loads - no additional filtering needed since it's done at query level
  useEffect(() => {
    if (trucks) {
      console.log('Setting display trucks:', trucks.length);
      setDisplayTrucks(trucks);
      setCurrentPage(1);
    }
  }, [trucks]);

  // Optimized filter handler with debouncing concept
  const handleFilterChange = useMemo(() => {
    return (filters: {
      brand: string;
      model: string;
      yearFrom: string;
      operatingHoursUntil: string;
      priceType: string;
      priceUntil: string;
      location: string;
      sortBy: string;
      mileageTo?: string;
    }) => {
      if (!trucks) return;

      let filtered = [...trucks]; // Work with already filtered data

      // Apply additional filters
      if (filters.brand) {
        filtered = filtered.filter(truck => {
          const truckBrand = truck.brand.toLowerCase().replace(/\s+/g, '-');
          return truckBrand === filters.brand;
        });
      }

      if (filters.model && filters.model.trim()) {
        const modelLower = filters.model.toLowerCase().trim();
        filtered = filtered.filter(truck => 
          truck.model && truck.model.toLowerCase().includes(modelLower)
        );
      }

      if (filters.yearFrom) {
        filtered = filtered.filter(truck => truck.year >= parseInt(filters.yearFrom));
      }

      if (filters.operatingHoursUntil) {
        filtered = filtered.filter(truck => (truck.mileage || 0) <= parseInt(filters.operatingHoursUntil));
      }

      if (filters.mileageTo) {
        filtered = filtered.filter(truck => (truck.mileage || 0) <= parseInt(filters.mileageTo));
      }

      if (filters.priceUntil) {
        filtered = filtered.filter(truck => truck.price <= parseInt(filters.priceUntil));
      }

      if (filters.location && filters.location.trim()) {
        const locationLower = filters.location.toLowerCase().trim();
        filtered = filtered.filter(truck => 
          truck.description && truck.description.toLowerCase().includes(locationLower)
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "price-low":
            filtered.sort((a, b) => a.price - b.price);
            break;
          case "price-high":
            filtered.sort((a, b) => b.price - a.price);
            break;
          case "year-new":
            filtered.sort((a, b) => b.year - a.year);
            break;
          case "year-old":
            filtered.sort((a, b) => a.year - b.year);
            break;
          case "hours-low":
            filtered.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
            break;
          case "hours-high":
            filtered.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
            break;
          case "name-asc":
            filtered.sort((a, b) => a.model.localeCompare(b.model));
            break;
          case "name-desc":
            filtered.sort((a, b) => b.model.localeCompare(a.model));
            break;
        }
      }

      setDisplayTrucks(filtered);
      setCurrentPage(1);
    };
  }, [trucks]);

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(displayTrucks.length / TRUCKS_PER_PAGE);
    const startIndex = (currentPage - 1) * TRUCKS_PER_PAGE;
    const endIndex = startIndex + TRUCKS_PER_PAGE;
    const currentTrucks = displayTrucks.slice(startIndex, endIndex);
    
    return { totalPages, startIndex, endIndex, currentTrucks };
  }, [displayTrucks, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  if (error) {
    console.error('TruckCategory error:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">{t('common.error')}</div>
            <p className="text-gray-600">Problema ao carregar os dados. Tente novamente mais tarde.</p>
          </div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">{t('category.categoryNotFound')}</div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Category Header */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-[150px] bg-blue-500">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.title}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">{data.description}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <TruckFilter category={category} onFilterChange={handleFilterChange} />

          {/* Results count and pagination info */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              {t('category.showing', { 
                start: Math.min(paginationData.startIndex + 1, displayTrucks.length), 
                end: Math.min(paginationData.endIndex, displayTrucks.length), 
                total: displayTrucks.length 
              })}
              {paginationData.totalPages > 1 && (
                <span className="ml-2 text-gray-500">
                  ({t('category.page', { current: currentPage, total: paginationData.totalPages })})
                </span>
              )}
            </p>
          </div>

          {/* Vehicles Grid or No Results */}
          {displayTrucks.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {paginationData.currentTrucks.map((truck) => (
                  <Card key={truck.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                        onClick={() => handleVehicleClick(truck.id)}>
                    <div className="relative overflow-hidden">
                      <img 
                        src={truck.images && truck.images.length > 0 ? truck.images[0] : "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop"} 
                        alt={truck.model} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <Badge className="absolute top-4 left-4 bg-blue-600">
                        {truck.subcategory || truck.category}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{truck.brand} {truck.model}</CardTitle>
                      <CardDescription className="text-2xl font-bold text-orange-600">
                        ${truck.price.toLocaleString()}
                      </CardDescription>
                      <div className="text-sm text-gray-500">
                        {truck.year} • {truck.mileage ? truck.mileage.toLocaleString() : '0'} hours
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-6">
                        {truck.features && truck.features.length > 0 ? (
                          truck.features.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                              {feature}
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                              {truck.engine} Engine
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                              {truck.transmission} Transmission
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                              {truck.condition} Condition
                            </div>
                            {truck.horsepower && (
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                                {truck.horsepower} HP
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-slate-800 hover:bg-slate-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVehicleClick(truck.id);
                                }}>
                          {t('common.viewDetails')}
                        </Button>
                        <Button variant="outline" 
                                className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle quote request
                                }}>
                          {t('common.contactNow')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
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
                    
                    {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
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
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < paginationData.totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === paginationData.totalPages ? "pointer-events-none opacity-50" : ""}
                      />
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

export default TruckCategory;
