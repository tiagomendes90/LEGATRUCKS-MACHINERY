
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown, Filter, Search } from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
import { useTranslation } from "react-i18next";

interface TruckFilterProps {
  category?: string;
  onFilterChange: (filters: any) => void;
}

const TruckFilter = ({ category, onFilterChange }: TruckFilterProps) => {
  const { t } = useTranslation();
  const { data: brands = [], isLoading: brandsLoading } = useBrands(category);
  
  const [filters, setFilters] = useState({
    brand: "",
    model: "",
    yearFrom: "",
    yearTo: "",
    priceFrom: "",
    priceTo: "",
    mileageFrom: "",
    mileageTo: "",
    condition: "",
    fuelType: "",
    transmission: "",
    location: "",
    sortBy: "",
    category: "",
    search: ""
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    if (key === "brand") {
      newFilters.model = "";
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      brand: "",
      model: "",
      yearFrom: "",
      yearTo: "",
      priceFrom: "",
      priceTo: "",
      mileageFrom: "",
      mileageTo: "",
      condition: "",
      fuelType: "",
      transmission: "",
      location: "",
      sortBy: "",
      category: "",
      search: ""
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const getAvailableModels = () => {
    // For now, return empty array since we need to implement model filtering based on selected brand
    return [];
  };

  if (brandsLoading) {
    return <div className="w-full bg-white shadow-sm border-b p-4">Loading filters...</div>;
  }

  return (
    <div className="w-full bg-white shadow-sm border-b">
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="container mx-auto px-4 py-6">
          {/* First Row - 4 columns grid with Search, Subcategory, Brand, and Vehicle Condition */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Search Box */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                {t('common.search')}
              </Label>
              <div className="relative">
                <form onSubmit={handleSearchSubmit} className="flex">
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search vehicles..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="ml-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Subcategory
              </Label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All subcategories" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="heavy-trucks">Heavy Trucks</SelectItem>
                  <SelectItem value="medium-trucks">Medium Trucks</SelectItem>
                  <SelectItem value="light-trucks">Light Trucks</SelectItem>
                  <SelectItem value="trailers">Trailers</SelectItem>
                  <SelectItem value="buses">Buses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                {t('filters.brand')}
              </Label>
              <Select value={filters.brand} onValueChange={(value) => handleFilterChange("brand", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('filters.selectBrand')} />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.slug}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition" className="text-sm font-medium text-gray-700">
                Vehicle Condition
              </Label>
              <Select value={filters.condition} onValueChange={(value) => handleFilterChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any condition" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="restored">Restored</SelectItem>
                  <SelectItem value="modified">Modified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Collapsible Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Advanced Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear All
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4">
                {/* Second Row - Model, Year Range, Price Range */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Model */}
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-medium text-gray-700">
                      {t('filters.model')}
                    </Label>
                    <Select 
                      value={filters.model} 
                      onValueChange={(value) => handleFilterChange("model", value)}
                      disabled={!filters.brand}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('filters.selectModel')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {getAvailableModels().map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('filters.year')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="From"
                        value={filters.yearFrom}
                        onChange={(e) => handleFilterChange("yearFrom", e.target.value)}
                        min="1980"
                        max="2025"
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        value={filters.yearTo}
                        onChange={(e) => handleFilterChange("yearTo", e.target.value)}
                        min="1980"
                        max="2025"
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('filters.price')} (€)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.priceFrom}
                        onChange={(e) => handleFilterChange("priceFrom", e.target.value)}
                        min="0"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.priceTo}
                        onChange={(e) => handleFilterChange("priceTo", e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Third Row - Mileage, Fuel Type, Transmission */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Mileage Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{t('filters.mileage')} (km)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.mileageFrom}
                        onChange={(e) => handleFilterChange("mileageFrom", e.target.value)}
                        min="0"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.mileageTo}
                        onChange={(e) => handleFilterChange("mileageTo", e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Fuel Type */}
                  <div className="space-y-2">
                    <Label htmlFor="fuelType" className="text-sm font-medium text-gray-700">
                      Fuel Type
                    </Label>
                    <Select value={filters.fuelType} onValueChange={(value) => handleFilterChange("fuelType", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any fuel type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="gasoline">Gasoline</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transmission */}
                  <div className="space-y-2">
                    <Label htmlFor="transmission" className="text-sm font-medium text-gray-700">
                      Transmission
                    </Label>
                    <Select value={filters.transmission} onValueChange={(value) => handleFilterChange("transmission", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any transmission" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fourth Row - Location and Sort */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                      {t('filters.location')}
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder={t('filters.enterLocation')}
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
                      {t('filters.sortBy')}
                    </Label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="price-asc">{t('filters.priceSort.low')}</SelectItem>
                        <SelectItem value="price-desc">{t('filters.priceSort.high')}</SelectItem>
                        <SelectItem value="year-desc">{t('filters.yearSort.new')}</SelectItem>
                        <SelectItem value="year-asc">{t('filters.yearSort.old')}</SelectItem>
                        <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
                        <SelectItem value="mileage-desc">Mileage: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Trucks</h3>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 bg-white">
                <div className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>

                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="mobile-search" className="text-sm font-medium">
                      {t('common.search')}
                    </Label>
                    <form onSubmit={handleSearchSubmit} className="flex">
                      <Input
                        id="mobile-search"
                        type="text"
                        placeholder="Search vehicles..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" className="ml-2 bg-blue-600 hover:bg-blue-700">
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subcategory</Label>
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All subcategories" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="heavy-trucks">Heavy Trucks</SelectItem>
                        <SelectItem value="medium-trucks">Medium Trucks</SelectItem>
                        <SelectItem value="light-trucks">Light Trucks</SelectItem>
                        <SelectItem value="trailers">Trailers</SelectItem>
                        <SelectItem value="buses">Buses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('filters.brand')}</Label>
                    <Select value={filters.brand} onValueChange={(value) => handleFilterChange("brand", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('filters.selectBrand')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.slug}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('filters.model')}</Label>
                    <Select 
                      value={filters.model} 
                      onValueChange={(value) => handleFilterChange("model", value)}
                      disabled={!filters.brand}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('filters.selectModel')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {getAvailableModels().map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vehicle Condition */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Vehicle Condition</Label>
                    <RadioGroup
                      value={filters.condition}
                      onValueChange={(value) => handleFilterChange("condition", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="" id="mobile-condition-any" />
                        <Label htmlFor="mobile-condition-any">Any</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="mobile-condition-new" />
                        <Label htmlFor="mobile-condition-new">New</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="used" id="mobile-condition-used" />
                        <Label htmlFor="mobile-condition-used">Used</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="restored" id="mobile-condition-restored" />
                        <Label htmlFor="mobile-condition-restored">Restored</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="modified" id="mobile-condition-modified" />
                        <Label htmlFor="mobile-condition-modified">Modified</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Year Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('filters.year')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="From"
                        value={filters.yearFrom}
                        onChange={(e) => handleFilterChange("yearFrom", e.target.value)}
                        min="1980"
                        max="2025"
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        value={filters.yearTo}
                        onChange={(e) => handleFilterChange("yearTo", e.target.value)}
                        min="1980"
                        max="2025"
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('filters.price')} (€)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.priceFrom}
                        onChange={(e) => handleFilterChange("priceFrom", e.target.value)}
                        min="0"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.priceTo}
                        onChange={(e) => handleFilterChange("priceTo", e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Mileage Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('filters.mileage')} (km)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.mileageFrom}
                        onChange={(e) => handleFilterChange("mileageFrom", e.target.value)}
                        min="0"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.mileageTo}
                        onChange={(e) => handleFilterChange("mileageTo", e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Fuel Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fuel Type</Label>
                    <Select value={filters.fuelType} onValueChange={(value) => handleFilterChange("fuelType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any fuel type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="gasoline">Gasoline</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transmission */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Transmission</Label>
                    <Select value={filters.transmission} onValueChange={(value) => handleFilterChange("transmission", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any transmission" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('filters.location')}</Label>
                    <Input
                      type="text"
                      placeholder={t('filters.enterLocation')}
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('filters.sortBy')}</Label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="price-asc">{t('filters.priceSort.low')}</SelectItem>
                        <SelectItem value="price-desc">{t('filters.priceSort.high')}</SelectItem>
                        <SelectItem value="year-desc">{t('filters.yearSort.new')}</SelectItem>
                        <SelectItem value="year-asc">{t('filters.yearSort.old')}</SelectItem>
                        <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
                        <SelectItem value="mileage-desc">Mileage: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Quick Search for Mobile */}
          <div className="mb-4">
            <form onSubmit={handleSearchSubmit} className="flex">
              <Input
                type="text"
                placeholder="Quick search..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" className="ml-2 bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckFilter;
