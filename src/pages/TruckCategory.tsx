
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Calendar, Gauge, Fuel } from "lucide-react";
import { useTrucks } from "@/hooks/useTrucks";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useBrands } from "@/hooks/useBrands";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TruckCategory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: trucks = [], isLoading } = useTrucks();
  
  const [filters, setFilters] = useState({
    subcategory: "",
    brand: "",
    condition: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: ""
  });

  const category = location.pathname.substring(1);
  
  // Get filter options based on current category
  const { data: subcategoryOptions = [] } = useFilterOptions(category, 'subcategory');
  const { data: brands = [] } = useBrands(category);

  const categoryInfo = {
    trucks: {
      title: t('category.trucks.title'),
      description: t('category.trucks.description')
    },
    machinery: {
      title: t('category.machinery.title'),
      description: t('category.machinery.description')
    },
    agriculture: {
      title: t('category.agriculture.title'),
      description: t('category.agriculture.description')
    }
  };

  const currentCategory = categoryInfo[category as keyof typeof categoryInfo];

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <h1 className="text-2xl font-bold text-center">{t('category.categoryNotFound')}</h1>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter vehicles by category and applied filters
  const filteredVehicles = trucks.filter(vehicle => {
    const matchesCategory = vehicle.category === category;
    const matchesSubcategory = !filters.subcategory || vehicle.subcategory === filters.subcategory;
    const matchesBrand = !filters.brand || vehicle.brand === filters.brand;
    const matchesCondition = !filters.condition || vehicle.condition === filters.condition;
    const matchesMinPrice = !filters.minPrice || vehicle.price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || vehicle.price <= parseFloat(filters.maxPrice);
    const matchesMinYear = !filters.minYear || vehicle.year >= parseInt(filters.minYear);
    const matchesMaxYear = !filters.maxYear || vehicle.year <= parseInt(filters.maxYear);

    return matchesCategory && matchesSubcategory && matchesBrand && matchesCondition &&
           matchesMinPrice && matchesMaxPrice && matchesMinYear && matchesMaxYear;
  });

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  const resetFilters = () => {
    setFilters({
      subcategory: "",
      brand: "",
      condition: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: ""
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="text-center">{t('common.loading')}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {currentCategory.title}
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              {currentCategory.description}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <Select value={filters.subcategory} onValueChange={(value) => setFilters({...filters, subcategory: value})}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.selectSubcategory')} />
              </SelectTrigger>
              <SelectContent>
                {subcategoryOptions.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.brand} onValueChange={(value) => setFilters({...filters, brand: value})}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.selectBrand')} />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.slug}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.condition} onValueChange={(value) => setFilters({...filters, condition: value})}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.selectCondition')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{t('admin.new')}</SelectItem>
                <SelectItem value="used">{t('admin.used')}</SelectItem>
                <SelectItem value="certified">{t('admin.certified')}</SelectItem>
                <SelectItem value="refurbished">{t('admin.refurbished')}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={t('admin.year')} 
              type="number"
              value={filters.minYear}
              onChange={(e) => setFilters({...filters, minYear: e.target.value})}
            />

            <Input
              placeholder="Max Year"
              type="number"
              value={filters.maxYear}
              onChange={(e) => setFilters({...filters, maxYear: e.target.value})}
            />

            <Input
              placeholder="Min Price"
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
            />

            <Button variant="outline" onClick={resetFilters}>
              {t('common.filter')}
            </Button>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="container mx-auto px-6 py-12">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('category.noVehicles')}</h3>
            <p className="text-gray-500">{t('category.adjustFilters')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleVehicleClick(vehicle.id)}
              >
                <div className="aspect-video bg-gray-200 rounded-t-lg">
                  {vehicle.images && vehicle.images[0] ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Truck className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <Badge variant={vehicle.condition === 'new' ? 'default' : 'secondary'}>
                      {vehicle.condition}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{vehicle.year}</span>
                    </div>
                    
                    {vehicle.mileage && (
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        <span>{vehicle.mileage.toLocaleString()} km</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      <span>{vehicle.engine}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-orange-600">
                      ${vehicle.price.toLocaleString()}
                    </span>
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleVehicleClick(vehicle.id);
                    }}>
                      {t('common.viewDetails')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default TruckCategory;
