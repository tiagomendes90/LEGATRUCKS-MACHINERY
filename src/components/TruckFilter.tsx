
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";

interface TruckFilterProps {
  onFilterChange: (filters: {
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
  }) => void;
}

const TruckFilter = ({ onFilterChange }: TruckFilterProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [engineType, setEngineType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = () => {
    onFilterChange({
      searchTerm,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      maxMileage,
      engineType,
      transmission,
      fuelType,
      condition,
      brand,
      sortBy,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setMaxMileage("");
    setEngineType("");
    setTransmission("");
    setFuelType("");
    setCondition("");
    setBrand("");
    setSortBy("");
    onFilterChange({
      searchTerm: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      maxMileage: "",
      engineType: "",
      transmission: "",
      fuelType: "",
      condition: "",
      brand: "",
      sortBy: "",
    });
  };

  const hasActiveFilters = searchTerm || minPrice || maxPrice || minYear || maxYear || maxMileage || engineType || transmission || fuelType || condition || brand || sortBy;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter Trucks</h3>
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
          {/* Search by name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by name or model
            </label>
            <Input
              placeholder="Enter truck name or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Brand and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="volvo">Volvo</SelectItem>
                  <SelectItem value="scania">Scania</SelectItem>
                  <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
                  <SelectItem value="man">MAN</SelectItem>
                  <SelectItem value="daf">DAF</SelectItem>
                  <SelectItem value="iveco">Iveco</SelectItem>
                  <SelectItem value="kenworth">Kenworth</SelectItem>
                  <SelectItem value="peterbilt">Peterbilt</SelectItem>
                  <SelectItem value="freightliner">Freightliner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                  <SelectItem value="refurbished">Refurbished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price ($)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price ($)
              </label>
              <Input
                type="number"
                placeholder="500,000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Year range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Year
              </label>
              <Input
                type="number"
                placeholder="2000"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Year
              </label>
              <Input
                type="number"
                placeholder="2024"
                value={maxYear}
                onChange={(e) => setMaxYear(e.target.value)}
              />
            </div>
          </div>

          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Mileage (miles)
            </label>
            <Input
              type="number"
              placeholder="500,000"
              value={maxMileage}
              onChange={(e) => setMaxMileage(e.target.value)}
            />
          </div>

          {/* Engine and Transmission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engine Type
              </label>
              <Select value={engineType} onValueChange={setEngineType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select engine type" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="cummins-x15">Cummins X15</SelectItem>
                  <SelectItem value="detroit-dd15">Detroit DD15</SelectItem>
                  <SelectItem value="caterpillar-c15">Caterpillar C15</SelectItem>
                  <SelectItem value="paccar-px-9">Paccar PX-9</SelectItem>
                  <SelectItem value="volvo-d13">Volvo D13</SelectItem>
                  <SelectItem value="mack-mp8">Mack MP8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transmission
              </label>
              <Select value={transmission} onValueChange={setTransmission}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="automated-manual">Automated Manual</SelectItem>
                  <SelectItem value="cvt">CVT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Type
            </label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="gasoline">Gasoline</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="natural-gas">Natural Gas</SelectItem>
                <SelectItem value="biodiesel">Biodiesel</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                <SelectItem value="mileage-high">Mileage: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
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
