import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TruckFilter from "@/components/TruckFilter";

const TruckCategory = () => {
  const { category } = useParams();
  const [filteredTrucks, setFilteredTrucks] = useState<any[]>([]);
  
  const categoryData = {
    "heavy-duty": {
      title: "Heavy Duty Trucks",
      description: "Powerful trucks designed for the toughest jobs and maximum payload capacity",
      trucks: [
        {
          id: 1,
          name: "Titan Heavy Hauler",
          price: "$125,000",
          priceNumber: 125000,
          image: "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
          specs: ["40-ton capacity", "Cummins X15 Engine", "18-speed transmission", "Air suspension"]
        },
        {
          id: 2,
          name: "MaxLoad Pro",
          price: "$135,000",
          priceNumber: 135000,
          image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=500&h=300&fit=crop",
          specs: ["45-ton capacity", "Detroit DD15 Engine", "Automated transmission", "Advanced safety systems"]
        },
        {
          id: 3,
          name: "Industrial Beast",
          price: "$145,000",
          priceNumber: 145000,
          image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=500&h=300&fit=crop",
          specs: ["50-ton capacity", "Caterpillar C15 Engine", "Heavy-duty chassis", "Off-road capability"]
        }
      ]
    },
    "medium-duty": {
      title: "Medium Duty Trucks",
      description: "Versatile trucks perfect for regional delivery and mid-range hauling operations",
      trucks: [
        {
          id: 4,
          name: "Regional Express",
          price: "$75,000",
          priceNumber: 75000,
          image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=300&fit=crop",
          specs: ["25-ton capacity", "Paccar PX-9 Engine", "10-speed transmission", "Fuel efficient design"]
        },
        {
          id: 5,
          name: "Urban Hauler",
          price: "$85,000",
          priceNumber: 85000,
          image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&h=300&fit=crop",
          specs: ["30-ton capacity", "Cummins B6.7 Engine", "City-optimized steering", "Low emission certified"]
        },
        {
          id: 6,
          name: "Fleet Master",
          price: "$80,000",
          priceNumber: 80000,
          image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&h=300&fit=crop",
          specs: ["28-ton capacity", "Volvo D8 Engine", "Comfortable cab", "Advanced telematics"]
        }
      ]
    },
    "light-duty": {
      title: "Light Duty Trucks",
      description: "Efficient and agile trucks ideal for urban delivery and last-mile logistics",
      trucks: [
        {
          id: 7,
          name: "City Runner",
          price: "$45,000",
          priceNumber: 45000,
          image: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=500&h=300&fit=crop",
          specs: ["10-ton capacity", "Ford EcoBoost Engine", "6-speed manual", "Compact design"]
        },
        {
          id: 8,
          name: "Delivery Pro",
          price: "$52,000",
          priceNumber: 52000,
          image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=500&h=300&fit=crop",
          specs: ["12-ton capacity", "Isuzu 4HK1 Engine", "Automatic transmission", "Easy loading design"]
        },
        {
          id: 9,
          name: "Urban Express",
          price: "$48,000",
          priceNumber: 48000,
          image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=500&h=300&fit=crop",
          specs: ["8-ton capacity", "Chevrolet Duramax", "Excellent fuel economy", "Tight turning radius"]
        }
      ]
    }
  };

  const data = categoryData[category as keyof typeof categoryData];

  // Initialize filtered trucks with all trucks when component mounts
  useState(() => {
    if (data) {
      setFilteredTrucks(data.trucks);
    }
  });

  const handleFilterChange = (filters: {
    searchTerm: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
  }) => {
    if (!data) return;

    let filtered = [...data.trucks];

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(truck =>
        truck.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(truck => truck.priceNumber >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(truck => truck.priceNumber <= parseInt(filters.maxPrice));
    }

    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "price-low":
          filtered.sort((a, b) => a.priceNumber - b.priceNumber);
          break;
        case "price-high":
          filtered.sort((a, b) => b.priceNumber - a.priceNumber);
          break;
        case "name-asc":
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name-desc":
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
      }
    }

    setFilteredTrucks(filtered);
  };

  if (!data) {
    return <div>Category not found</div>;
  }

  const trucksToShow = filteredTrucks.length > 0 ? filteredTrucks : data.trucks;

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
                Showing {trucksToShow.length} of {data.trucks.length} trucks
              </p>
            </div>
          )}

          {/* Trucks Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trucksToShow.map((truck) => (
              <Card key={truck.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative overflow-hidden">
                  <img 
                    src={truck.image} 
                    alt={truck.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4 bg-blue-600">
                    {data.title.split(' ')[0]} {data.title.split(' ')[1]}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{truck.name}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-orange-600">{truck.price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {truck.specs.map((spec, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        {spec}
                      </div>
                    ))}
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

          {/* No results message */}
          {category === "heavy-duty" && trucksToShow.length === 0 && (
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
