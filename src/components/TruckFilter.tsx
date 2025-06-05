
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
import { useFilterOptions } from "@/hooks/useFilterOptions";

interface TruckFilterProps {
  category: string;
  onFilterChange: (filters: {
    brand: string;
    model: string;
    subcategory: string;
    yearFrom: string;
    operatingHoursUntil: string;
    priceType: string;
    priceUntil: string;
    location: string;
    sortBy: string;
    mileageTo?: string;
  }) => void;
}

const TruckFilter = ({ category, onFilterChange }: TruckFilterProps) => {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [operatingHoursUntil, setOperatingHoursUntil] = useState("");
  const [priceType, setPriceType] = useState("gross");
  const [priceUntil, setPriceUntil] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [mileageTo, setMileageTo] = useState("");
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);

  // Fetch brands and filter options from database
  const { data: brands = [], isLoading: brandsLoading } = useBrands(category);
  const { data: subcategoryOptions = [] } = useFilterOptions(category, 'subcategory');
  const { data: yearOptions = [] } = useFilterOptions(category, 'year');
  const { data: priceOptions = [] } = useFilterOptions(category, 'price');
  const { data: hoursOptions = [] } = useFilterOptions(category, 'hours');

  const handleFilterChange = () => {
    onFilterChange({
      brand,
      model,
      subcategory,
      yearFrom,
      operatingHoursUntil,
      priceType,
      priceUntil,
      location,
      sortBy,
      mileageTo,
    });
  };

  const clearFilters = () => {
    setBrand("");
    setModel("");
    setSubcategory("");
    setYearFrom("");
    setOperatingHoursUntil("");
    setPriceType("gross");
    setPriceUntil("");
    setLocation("");
    setSortBy("");
    setMileageTo("");
    onFilterChange({
      brand: "",
      model: "",
      subcategory: "",
      yearFrom: "",
      operatingHoursUntil: "",
      priceType: "gross",
      priceUntil: "",
      location: "",
      sortBy: "",
      mileageTo: "",
    });
  };

  // Get category-specific icon from homepage SVGs
  const getCategoryIcon = () => {
    switch (category) {
      case 'trucks':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-blue-600">
              <g fill="currentColor">
                <rect x="10" y="40" width="60" height="25" rx="2"/>
                <rect x="70" y="35" width="25" height="30" rx="2"/>
                <circle cx="25" cy="75" r="8"/>
                <circle cx="55" cy="75" r="8"/>
                <circle cx="80" cy="75" r="8"/>
                <rect x="15" y="45" width="15" height="8" fill="white"/>
                <rect x="35" y="45" width="15" height="8" fill="white"/>
                <rect x="75" y="40" width="15" height="8" fill="white"/>
              </g>
            </svg>
          </div>
        );
      case 'machinery':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-blue-600">
              <g fill="currentColor">
                <rect x="30" y="50" width="40" height="20" rx="2"/>
                <circle cx="35" cy="80" r="8"/>
                <circle cx="65" cy="80" r="8"/>
                <rect x="20" y="30" width="8" height="25" rx="2"/>
                <rect x="15" y="25" width="18" height="8" rx="2"/>
                <path d="M75 45 L85 35 L90 40 L80 50 Z"/>
                <rect x="72" y="40" width="20" height="6" rx="1"/>
              </g>
            </svg>
          </div>
        );
      case 'agriculture':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-blue-600">
              <g fill="currentColor">
                <rect x="35" y="45" width="30" height="20" rx="2"/>
                <circle cx="25" cy="80" r="12"/>
                <circle cx="75" cy="80" r="12"/>
                <rect x="20" y="25" width="6" height="25" rx="1"/>
                <circle cx="23" cy="20" r="4"/>
                <rect x="65" y="35" width="20" height="8" rx="1"/>
                <path d="M15 75 Q20 70 25 75"/>
                <path d="M75 75 Q80 70 85 75"/>
              </g>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getResultsCount = () => {
    switch (category) {
      case 'trucks':
        return '26,781 offers';
      case 'machinery':
        return '13,075 offers';
      case 'agriculture':
        return '11,422 offers';
      default:
        return 'offers';
    }
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'trucks':
        return 'Trucks';
      case 'machinery':
        return 'Machinery';
      case 'agriculture':
        return 'Agriculture';
      default:
        return category;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-8">
      <div className="p-6">
        {/* Header with category info */}
        <div className="flex items-center gap-4 mb-6">
          {getCategoryIcon()}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getCategoryTitle()}</h2>
            <p className="text-gray-600">{getResultsCount()}</p>
          </div>
        </div>

        {/* Main filter grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <Select value={brand} onValueChange={setBrand} disabled={brandsLoading}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {brands.map((brandItem) => (
                  <SelectItem key={brandItem.id} value={brandItem.slug}>
                    {brandItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <Input
              placeholder="All models"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Category/Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {subcategoryOptions.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year/Registration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {category === 'trucks' ? 'Registration date from' : 'Year of construction from'}
            </label>
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Any year" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {yearOptions.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second row of filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Price until */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price until
            </label>
            <Select value={priceUntil} onValueChange={setPriceUntil}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {priceOptions.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operating hours until / Kilometers to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {category === 'trucks' ? 'Kilometers to' : 'Operating hours until'}
            </label>
            <Select value={category === 'trucks' ? mileageTo : operatingHoursUntil} onValueChange={category === 'trucks' ? setMileageTo : setOperatingHoursUntil}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={category === 'trucks' ? 'Any km' : 'Any hours'} />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {hoursOptions.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City or postal code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City or postal code
            </label>
            <Input
              placeholder="Enter location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Search Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              &nbsp;
            </label>
            <Button onClick={handleFilterChange} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              🔍 Search {getResultsCount()}
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
            >
              Reset filters
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowAdditionalFilters(!showAdditionalFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
            >
              Additional filters
              {showAdditionalFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Sort by */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="year-new">Year: Newest First</SelectItem>
                <SelectItem value="year-old">Year: Oldest First</SelectItem>
                <SelectItem value="hours-low">Operating Hours: Low to High</SelectItem>
                <SelectItem value="hours-high">Operating Hours: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional filters panel */}
        {showAdditionalFilters && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Price information
                </label>
                <RadioGroup value={priceType} onValueChange={setPriceType} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gross" id="gross" />
                    <Label htmlFor="gross">Gross price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="net" id="net" />
                    <Label htmlFor="net">Net price</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Additional options can be added here */}
              <div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckFilter;
