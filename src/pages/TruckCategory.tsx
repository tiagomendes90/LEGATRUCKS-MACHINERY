import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TruckFilter from "@/components/TruckFilter";
import { useTrucks } from "@/hooks/useTrucks";

const TRUCKS_PER_PAGE = 12;

const TruckCategory = () => {
  const location = useLocation();
  const { data: allTrucks, isLoading, error } = useTrucks();
  const [displayTrucks, setDisplayTrucks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Get category from the pathname
  const category = location.pathname.substring(1); // Remove the leading slash

  console.log('Current pathname:', location.pathname);
  console.log('Extracted category:', category);
  console.log('All trucks:', allTrucks?.length || 0);

  const categoryData = {
    "trucks": {
      title: "Trucks",
      description: "Powerful trucks designed for the toughest jobs and maximum payload capacity"
    },
    "machinery": {
      title: "Machinery", 
      description: "Heavy machinery perfect for construction, mining and industrial operations"
    },
    "agriculture": {
      title: "Agriculture",
      description: "Specialized agricultural equipment for farming and crop management"
    }
  };

  const data = categoryData[category as keyof typeof categoryData];

  // Set initial trucks filtered by category when data loads
  useEffect(() => {
    if (allTrucks && category) {
      console.log('Filtering trucks for category:', category);
      const categoryTrucks = allTrucks.filter(truck => {
        console.log('Truck category:', truck.category, 'Target category:', category);
        return truck.category === category;
      });
      console.log('Filtered trucks:', categoryTrucks.length);
      setDisplayTrucks(categoryTrucks);
      setCurrentPage(1);
    }
  }, [allTrucks, category]);

  const handleFilterChange = (filters: {
    brand: string;
    model: string;
    yearFrom: string;
    operatingHoursUntil: string;
    priceType: string;
    priceUntil: string;
    location: string;
    sortBy: string;
  }) => {
    if (!allTrucks || !category) return;

    // Start with trucks from the current category
    let filtered = allTrucks.filter(truck => truck.category === category);

    // Apply brand filter
    if (filters.brand) {
      filtered = filtered.filter(truck => {
        const truckBrand = truck.brand.toLowerCase().replace(/\s+/g, '-');
        return truckBrand === filters.brand;
      });
    }

    // Apply model filter
    if (filters.model && filters.model.trim()) {
      const modelLower = filters.model.toLowerCase().trim();
      filtered = filtered.filter(truck => 
        truck.model && truck.model.toLowerCase().includes(modelLower)
      );
    }

    // Apply year from filter
    if (filters.yearFrom) {
      filtered = filtered.filter(truck => truck.year >= parseInt(filters.yearFrom));
    }

    // Apply operating hours filter (using mileage as proxy for operating hours)
    if (filters.operatingHoursUntil) {
      filtered = filtered.filter(truck => (truck.mileage || 0) <= parseInt(filters.operatingHoursUntil));
    }

    // Apply price filter
    if (filters.priceUntil) {
      filtered = filtered.filter(truck => truck.price <= parseInt(filters.priceUntil));
    }

    // Apply location filter (basic text search in description)
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

  // Calculate pagination
  const totalPages = Math.ceil(displayTrucks.length / TRUCKS_PER_PAGE);
  const startIndex = (currentPage - 1) * TRUCKS_PER_PAGE;
  const endIndex = startIndex + TRUCKS_PER_PAGE;
  const currentTrucks = displayTrucks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading vehicles...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Error loading vehicles: {error.message}</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Category not found</div>
        </div>
        <Footer />
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
              Showing {startIndex + 1}-{Math.min(endIndex, displayTrucks.length)} of {displayTrucks.length} vehicles
              {totalPages > 1 && (
                <span className="ml-2 text-gray-500">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </p>
          </div>

          {/* Vehicles Grid */}
          {currentTrucks.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {currentTrucks.map((truck) => (
                  <Card key={truck.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative overflow-hidden">
                      <img 
                        src={truck.images && truck.images.length > 0 ? truck.images[0] : "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop"} 
                        alt={truck.model} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <Badge className="absolute top-4 left-4 bg-blue-600">
                        {data.title}
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
                        <Button className="flex-1 bg-slate-800 hover:bg-slate-700">
                          View Details
                        </Button>
                        <Button variant="outline" className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white">
                          Get Quote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
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
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">No vehicles match your current filters.</p>
              <p className="text-gray-400 mb-4">Try adjusting your search criteria or clear the filters.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TruckCategory;
