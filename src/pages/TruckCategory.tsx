
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TruckFilter from "@/components/TruckFilter";
import { useTrucks } from "@/hooks/useTrucks";

const TruckCategory = () => {
  const { category } = useParams();
  const { data: allTrucks, isLoading, error } = useTrucks();
  const [filteredTrucks, setFilteredTrucks] = useState<any[]>([]);
  
  const categoryData = {
    "heavy-duty": {
      title: "Heavy Duty Trucks",
      description: "Powerful trucks designed for the toughest jobs and maximum payload capacity"
    },
    "medium-duty": {
      title: "Medium Duty Trucks", 
      description: "Versatile trucks perfect for regional delivery and mid-range hauling operations"
    },
    "light-duty": {
      title: "Light Duty Trucks",
      description: "Efficient and agile trucks ideal for urban delivery and last-mile logistics"
    }
  };

  const data = categoryData[category as keyof typeof categoryData];

  // Filter trucks by category when data loads or category changes
  useEffect(() => {
    if (allTrucks && category) {
      const categoryTrucks = allTrucks.filter(truck => truck.category === category);
      setFilteredTrucks(categoryTrucks);
    }
  }, [allTrucks, category]);

  const handleFilterChange = (filters: {
    searchTerm: string;
    minPrice: string;
    maxPrice: string;
    minYear: string;
    maxYear: string;
    maxMileage: string;
    engineType: string;
    transmission: string;
    fuelType: string;
    condition: string;
    brand: string;
    sortBy: string;
  }) => {
    if (!allTrucks || !category) return;

    // Start with trucks from the current category
    let filtered = allTrucks.filter(truck => truck.category === category);

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(truck =>
        truck.model.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        truck.brand.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Filter by brand
    if (filters.brand) {
      filtered = filtered.filter(truck => truck.brand === filters.brand);
    }

    // Filter by condition
    if (filters.condition) {
      filtered = filtered.filter(truck => truck.condition === filters.condition);
    }

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(truck => truck.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(truck => truck.price <= parseInt(filters.maxPrice));
    }

    // Filter by year range
    if (filters.minYear) {
      filtered = filtered.filter(truck => truck.year >= parseInt(filters.minYear));
    }
    if (filters.maxYear) {
      filtered = filtered.filter(truck => truck.year <= parseInt(filters.maxYear));
    }

    // Filter by mileage
    if (filters.maxMileage) {
      filtered = filtered.filter(truck => (truck.mileage || 0) <= parseInt(filters.maxMileage));
    }

    // Filter by engine type
    if (filters.engineType) {
      filtered = filtered.filter(truck => truck.engine === filters.engineType);
    }

    // Filter by transmission
    if (filters.transmission) {
      filtered = filtered.filter(truck => truck.transmission === filters.transmission);
    }

    // Sort results
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
        case "mileage-low":
          filtered.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
          break;
        case "mileage-high":
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

    setFilteredTrucks(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading trucks...</div>
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
          <div className="text-lg text-red-600">Error loading trucks: {error.message}</div>
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

  const categoryTrucks = allTrucks ? allTrucks.filter(truck => truck.category === category) : [];
  const trucksToShow = filteredTrucks.length > 0 ? filteredTrucks : categoryTrucks;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Category Header */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.title}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">{data.description}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          {/* Add filter component only for heavy-duty category */}
          {category === "heavy-duty" && (
            <TruckFilter onFilterChange={handleFilterChange} />
          )}

          {/* Results count */}
          {category === "heavy-duty" && (
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {trucksToShow.length} of {categoryTrucks.length} trucks
              </p>
            </div>
          )}

          {/* Trucks Grid */}
          {trucksToShow.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trucksToShow.map((truck) => (
                <Card key={truck.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative overflow-hidden">
                    <img 
                      src={truck.images && truck.images.length > 0 ? truck.images[0] : "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop"} 
                      alt={truck.model}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-blue-600">
                      {data.title.split(' ')[0]} {data.title.split(' ')[1]}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{truck.brand} {truck.model}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-orange-600">
                      ${truck.price.toLocaleString()}
                    </CardDescription>
                    <div className="text-sm text-gray-500">
                      {truck.year} • {truck.mileage ? truck.mileage.toLocaleString() : '0'} miles
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No {data.title.toLowerCase()} found.</p>
              <p className="text-gray-400">Add trucks in the admin panel to see them here.</p>
            </div>
          )}

          {/* No results message for filtered results */}
          {category === "heavy-duty" && categoryTrucks.length > 0 && trucksToShow.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No trucks match your current filters.</p>
              <p className="text-gray-400">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TruckCategory;
