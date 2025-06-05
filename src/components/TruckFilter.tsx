
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
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

  const hasActiveFilters = brand || model || subcategory || yearFrom || operatingHoursUntil || priceUntil || location || sortBy || mileageTo;

  // Get category-specific icon
  const getCategoryIcon = () => {
    switch (category) {
      case 'trucks':
        return (
          <div className="w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <rect x="10" y="30" width="50" height="20" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
              <rect x="65" y="25" width="25" height="25" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
              <circle cx="25" cy="55" r="5" fill="currentColor"/>
              <circle cx="75" cy="55" r="5" fill="currentColor"/>
            </svg>
          </div>
        );
      case 'machinery':
        return (
          <div className="w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <rect x="20" y="35" width="40" height="15" fill="currentColor"/>
              <path d="M10 50 Q15 40 25 45 L35 40 Q45 35 55 40 L65 35 Q75 30 85 35 L90 40" stroke="currentColor" strokeWidth="3" fill="none"/>
              <circle cx="25" cy="52" r="4" fill="currentColor"/>
              <circle cx="55" cy="52" r="4" fill="currentColor"/>
              <rect x="65" y="25" width="15" height="10" fill="currentColor"/>
            </svg>
          </div>
        );
      case 'agriculture':
        return (
          <div className="w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <rect x="30" y="25" width="30" height="20" fill="currentColor"/>
              <circle cx="25" cy="50" r="8" fill="currentColor"/>
              <circle cx="65" cy="50" r="8" fill="currentColor"/>
              <rect x="15" y="15" width="8" height="25" fill="currentColor"/>
              <circle cx="19" cy="12" r="3" fill="currentColor"/>
            </svg>
          </div>
        );
      default:
        return <Filter className="h-8 w-8" />;
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

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-8">
      {/* Horizontal Filter Layout */}
      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Category Icon */}
          <div className="flex-shrink-0">
            {getCategoryIcon()}
          </div>

          {/* Filter Fields */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <Select value={brand} onValueChange={setBrand} disabled={brandsLoading}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Any" />
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

            {/* Category/Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Any" />
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

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <Input
                placeholder="Any"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Year/Registration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {category === 'trucks' ? 'Registration date from' : 'Year of construction from'}
              </label>
              <Select value={yearFrom} onValueChange={setYearFrom}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Any" />
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
        </div>

        {/* Second Row */}
        <div className="flex items-end gap-6 mt-4">
          <div className="flex-shrink-0 w-16"></div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Price until */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price until
              </label>
              <Select value={priceUntil} onValueChange={setPriceUntil}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Any" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {category === 'trucks' ? 'Kilometers to' : 'Operating hours until'}
              </label>
              <Select value={category === 'trucks' ? mileageTo : operatingHoursUntil} onValueChange={category === 'trucks' ? setMileageTo : setOperatingHoursUntil}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Any" />
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

            {/* Empty space for alignment */}
            <div></div>

            {/* Search Button */}
            <div>
              <Button onClick={handleFilterChange} className="w-full h-12 bg-gray-600 hover:bg-gray-700 text-white">
                🔍 {getResultsCount()}
              </Button>
            </div>
          </div>
        </div>

        {/* Reset and Additional Filters */}
        <div className="flex items-center justify-end gap-4 mt-4">
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
          >
            🔄 Reset
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowAdditionalFilters(!showAdditionalFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
          >
            ⚙️ Additional filters
          </Button>
        </div>

        {/* Additional filters panel */}
        {showAdditionalFilters && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price information
                </label>
                <RadioGroup value={priceType} onValueChange={setPriceType} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gross" id="gross" />
                    <Label htmlFor="gross">Gross</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="net" id="net" />
                    <Label htmlFor="net">Net</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* City or postal code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City or postal code
                </label>
                <Input
                  placeholder="Enter city or postal code..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sorting option" />
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckFilter;
