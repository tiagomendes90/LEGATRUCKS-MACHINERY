import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBrands } from "@/hooks/useBrands";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useTrucks } from "@/hooks/useTrucks";

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
    vehicleCondition?: string;
    yearUntil?: string;
    mileageFrom?: string;
    priceFrom?: string;
    performance?: string;
    performanceUntil?: string;
    weightFrom?: string;
    weightUntil?: string;
    fuelType?: string[];
    gearbox?: string;
    cylinderFrom?: string;
    cylinderUntil?: string;
    tankSizeFrom?: string;
    tankSizeUntil?: string;
    pollutantClass?: string;
    environmentalSticker?: string;
    particleFilter?: boolean;
    equipment?: string[];
    airConditioning?: string;
    axles?: string;
    wheelFormula?: string[];
    permissibleWeightFrom?: string;
    permissibleWeightUntil?: string;
    hydraulicSystem?: string;
    cruiseControl?: string;
    driversCab?: string;
    interior?: string[];
    bodyColor?: string[];
  }) => void;
}

const TruckFilter = ({ category, onFilterChange }: TruckFilterProps) => {
  const [brand, setBrand] = useState("all");
  const [model, setModel] = useState("");
  const [subcategory, setSubcategory] = useState("all");
  const [yearFrom, setYearFrom] = useState("any");
  const [operatingHoursUntil, setOperatingHoursUntil] = useState("unlimited");
  const [priceType, setPriceType] = useState("gross");
  const [priceUntil, setPriceUntil] = useState("unlimited");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [mileageTo, setMileageTo] = useState("unlimited");
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);

  // Additional filter states
  const [vehicleCondition, setVehicleCondition] = useState("any");
  const [yearUntil, setYearUntil] = useState("");
  const [mileageFrom, setMileageFrom] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [performance, setPerformance] = useState("");
  const [performanceUntil, setPerformanceUntil] = useState("");
  const [weightFrom, setWeightFrom] = useState("");
  const [weightUntil, setWeightUntil] = useState("");
  const [fuelType, setFuelType] = useState<string[]>([]);
  const [gearbox, setGearbox] = useState("");
  const [cylinderFrom, setCylinderFrom] = useState("");
  const [cylinderUntil, setCylinderUntil] = useState("");
  const [tankSizeFrom, setTankSizeFrom] = useState("");
  const [tankSizeUntil, setTankSizeUntil] = useState("");
  const [pollutantClass, setPollutantClass] = useState("");
  const [environmentalSticker, setEnvironmentalSticker] = useState("");
  const [particleFilter, setParticleFilter] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [airConditioning, setAirConditioning] = useState("");
  const [axles, setAxles] = useState("");
  const [wheelFormula, setWheelFormula] = useState<string[]>([]);
  const [permissibleWeightFrom, setPermissibleWeightFrom] = useState("");
  const [permissibleWeightUntil, setPermissibleWeightUntil] = useState("");
  const [hydraulicSystem, setHydraulicSystem] = useState("");
  const [cruiseControl, setCruiseControl] = useState("");
  const [driversCab, setDriversCab] = useState("");
  const [interior, setInterior] = useState<string[]>([]);
  const [bodyColor, setBodyColor] = useState<string[]>([]);

  // Fetch data
  const { data: brands = [], isLoading: brandsLoading } = useBrands(category);
  const { data: subcategoryOptions = [] } = useFilterOptions(category, 'subcategory');
  const { data: yearOptions = [] } = useFilterOptions(category, 'year');
  const { data: priceOptions = [] } = useFilterOptions(category, 'price');
  const { data: hoursOptions = [] } = useFilterOptions(category, 'hours');
  const { data: allTrucks = [] } = useTrucks();

  // Calculate offers count based on current filters
  const getOffersCount = () => {
    const filteredTrucks = allTrucks.filter(truck => truck.category === category);
    return `${filteredTrucks.length.toLocaleString()} offers`;
  };

  const handleFilterChange = () => {
    onFilterChange({
      brand: brand === "all" ? "" : brand,
      model,
      subcategory: subcategory === "all" ? "" : subcategory,
      yearFrom: yearFrom === "any" ? "" : yearFrom,
      operatingHoursUntil: operatingHoursUntil === "unlimited" ? "" : operatingHoursUntil,
      priceType,
      priceUntil: priceUntil === "unlimited" ? "" : priceUntil,
      location,
      sortBy: sortBy === "default" ? "" : sortBy,
      mileageTo: mileageTo === "unlimited" ? "" : mileageTo,
      vehicleCondition: vehicleCondition === "any" ? "" : vehicleCondition,
      yearUntil,
      mileageFrom,
      priceFrom,
      performance,
      performanceUntil,
      weightFrom,
      weightUntil,
      fuelType,
      gearbox,
      cylinderFrom,
      cylinderUntil,
      tankSizeFrom,
      tankSizeUntil,
      pollutantClass,
      environmentalSticker,
      particleFilter,
      equipment,
      airConditioning,
      axles,
      wheelFormula,
      permissibleWeightFrom,
      permissibleWeightUntil,
      hydraulicSystem,
      cruiseControl,
      driversCab,
      interior,
      bodyColor,
    });
  };

  const clearFilters = () => {
    setBrand("all");
    setModel("");
    setSubcategory("all");
    setYearFrom("any");
    setOperatingHoursUntil("unlimited");
    setPriceType("gross");
    setPriceUntil("unlimited");
    setLocation("");
    setSortBy("default");
    setMileageTo("unlimited");
    setVehicleCondition("any");
    
    // Clear additional filters
    setVehicleCondition("");
    setYearUntil("");
    setMileageFrom("");
    setPriceFrom("");
    setPerformance("");
    setPerformanceUntil("");
    setWeightFrom("");
    setWeightUntil("");
    setFuelType([]);
    setGearbox("");
    setCylinderFrom("");
    setCylinderUntil("");
    setTankSizeFrom("");
    setTankSizeUntil("");
    setPollutantClass("");
    setEnvironmentalSticker("");
    setParticleFilter(false);
    setEquipment([]);
    setAirConditioning("");
    setAxles("");
    setWheelFormula([]);
    setPermissibleWeightFrom("");
    setPermissibleWeightUntil("");
    setHydraulicSystem("");
    setCruiseControl("");
    setDriversCab("");
    setInterior([]);
    setBodyColor([]);
    
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
      vehicleCondition: "",
      yearUntil: "",
      mileageFrom: "",
      priceFrom: "",
      performance: "",
      performanceUntil: "",
      weightFrom: "",
      weightUntil: "",
      fuelType: [],
      gearbox: "",
      cylinderFrom: "",
      cylinderUntil: "",
      tankSizeFrom: "",
      tankSizeUntil: "",
      pollutantClass: "",
      environmentalSticker: "",
      particleFilter: false,
      equipment: [],
      airConditioning: "",
      axles: "",
      wheelFormula: [],
      permissibleWeightFrom: "",
      permissibleWeightUntil: "",
      hydraulicSystem: "",
      cruiseControl: "",
      driversCab: "",
      interior: [],
      bodyColor: [],
    });
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'trucks':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <Filter className="h-10 w-10 text-blue-600" />
          </div>
        );
      case 'machinery':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <Filter className="h-10 w-10 text-blue-600" />
          </div>
        );
      case 'agriculture':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <Filter className="h-10 w-10 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <Filter className="h-10 w-10 text-blue-600" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {getCategoryIcon()}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Filter {category}</h2>
            <p className="text-gray-600">{getOffersCount()}</p>
          </div>
        </div>
        <Button variant="outline" onClick={clearFilters}>
          Clear all filters
        </Button>
      </div>

      {/* Main Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        {/* 1. Subcategory */}
        <div className="space-y-2">
          <Label htmlFor="subcategory">Category</Label>
          <Select value={subcategory} onValueChange={(value) => {
            setSubcategory(value);
            handleFilterChange();
          }}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {subcategoryOptions.map((option) => (
                <SelectItem key={option.id} value={option.option_value}>
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Model */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            placeholder="Enter model"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              handleFilterChange();
            }}
          />
        </div>

        {/* 3. Brand */}
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Select value={brand} onValueChange={(value) => {
            setBrand(value);
            handleFilterChange();
          }}>
            <SelectTrigger>
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.slug}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <div className="flex gap-2">
            <Select value={priceType} onValueChange={(value) => {
              setPriceType(value);
              handleFilterChange();
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gross">Gross</SelectItem>
                <SelectItem value="net">Net</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceUntil} onValueChange={(value) => {
              setPriceUntil(value);
              handleFilterChange();
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Max price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">No limit</SelectItem>
                {priceOptions.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 5. Kilometers/Operating hours */}
        <div className="space-y-2">
          <Label htmlFor="hours">{category === 'trucks' ? 'Kilometers' : 'Operating hours'}</Label>
          <Select value={category === 'trucks' ? mileageTo : operatingHoursUntil} onValueChange={(value) => {
            if (category === 'trucks') {
              setMileageTo(value);
            } else {
              setOperatingHoursUntil(value);
            }
            handleFilterChange();
          }}>
            <SelectTrigger>
              <SelectValue placeholder={`Max ${category === 'trucks' ? 'km' : 'hours'}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unlimited">No limit</SelectItem>
              {hoursOptions.map((option) => (
                <SelectItem key={option.id} value={option.option_value}>
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 6. Registration date */}
        <div className="space-y-2">
          <Label htmlFor="year">Registration date</Label>
          <Select value={yearFrom} onValueChange={(value) => {
            setYearFrom(value);
            handleFilterChange();
          }}>
            <SelectTrigger>
              <SelectValue placeholder="From year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any year</SelectItem>
              {yearOptions.map((option) => (
                <SelectItem key={option.id} value={option.option_value}>
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 7. Vehicle condition */}
        <div className="space-y-2">
          <Label htmlFor="condition">Vehicle condition</Label>
          <Select value={vehicleCondition} onValueChange={(value) => {
            setVehicleCondition(value);
            handleFilterChange();
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Any condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any condition</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sort and Additional Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="sort">Sort by:</Label>
          <Select value={sortBy} onValueChange={(value) => {
            setSortBy(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose sorting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="year-new">Year: Newest first</SelectItem>
              <SelectItem value="year-old">Year: Oldest first</SelectItem>
              <SelectItem value="hours-low">Hours: Low to High</SelectItem>
              <SelectItem value="hours-high">Hours: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Collapsible open={showAdditionalFilters} onOpenChange={setShowAdditionalFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Additional filters
              {showAdditionalFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="w-full mt-4">
            {/* Additional filters content would go here */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600">Additional filters coming soon...</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default TruckFilter;
