
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
    });
  };

  const hasActiveFilters = brand || model || subcategory || yearFrom || operatingHoursUntil || priceUntil || location || sortBy;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter Vehicles</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 hover:text-blue-700"
        >
          {isOpen ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-6">
          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <Select value={brand} onValueChange={setBrand} disabled={brandsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={brandsLoading ? "Loading brands..." : "Select brand"} />
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
              placeholder="Enter model name..."
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
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

          {/* Year of construction from */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year of construction from
            </label>
            <div className="flex gap-2">
              <Select value={yearFrom} onValueChange={setYearFrom}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {yearOptions.map((option) => (
                    <SelectItem key={option.id} value={option.option_value}>
                      {option.option_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Year"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="flex-1"
                min="1900"
                max="2025"
              />
            </div>
          </div>

          {/* Operating hours until */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operating hours until
            </label>
            <div className="flex gap-2">
              <Select value={operatingHoursUntil} onValueChange={setOperatingHoursUntil}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select hours" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {hoursOptions.map((option) => (
                    <SelectItem key={option.id} value={option.option_value}>
                      {option.option_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Hours"
                value={operatingHoursUntil}
                onChange={(e) => setOperatingHoursUntil(e.target.value)}
                className="flex-1"
                min="0"
                max="20000"
              />
            </div>
          </div>

          {/* Price information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price information
            </label>
            <RadioGroup value={priceType} onValueChange={setPriceType} className="flex gap-6">
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

          {/* Price until */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price until
            </label>
            <div className="flex gap-2">
              <Select value={priceUntil} onValueChange={setPriceUntil}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {priceOptions.map((option) => (
                    <SelectItem key={option.id} value={option.option_value}>
                      {option.option_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Max price (€)"
                value={priceUntil}
                onChange={(e) => setPriceUntil(e.target.value)}
                className="flex-1"
                min="500"
                max="500000"
              />
            </div>
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

          {/* Additional filters */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowAdditionalFilters(!showAdditionalFilters)}
              className="flex items-center gap-2 p-0 h-auto text-blue-600 hover:text-blue-700"
            >
              Additional filters
              {showAdditionalFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showAdditionalFilters && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
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
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleFilterChange} className="bg-blue-600 hover:bg-blue-700">
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckFilter;
