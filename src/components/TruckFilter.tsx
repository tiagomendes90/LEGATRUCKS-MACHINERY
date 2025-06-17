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

  // Additional filter states
  const [vehicleCondition, setVehicleCondition] = useState("");
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
      vehicleCondition,
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
    });
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'trucks':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-10 w-16 text-blue-600">
              <path d="M42.79 12.34L40.45 7.65997C39.94 6.63997 38.9 5.99997 37.77 5.99997H33.01V3.99997C33.01 2.89997 32.11 1.99997 31.01 1.99997H7C5.9 1.99997 5 2.89997 5 3.99997V19H9.05C9.3 20.69 10.74 22 12.5 22C14.26 22 15.7 20.69 15.95 19H31.05C31.3 20.69 32.74 22 34.5 22C36.26 22 37.7 20.69 37.95 19H43V13.24C43 12.93 42.93 12.62 42.79 12.35V12.34ZM38.66 8.54997L40.38 12H37V7.99997H37.76C38.14 7.99997 38.48 8.20997 38.65 8.54997H38.66ZM31 3.99997V12H7V3.99997H31ZM7 14H31V17H15.65C15.09 15.82 13.89 15 12.5 15C11.11 15 9.92 15.82 9.35 17H7V14ZM12.5 20C11.67 20 11 19.33 11 18.5C11 17.67 11.67 17 12.5 17C13.33 17 14 17.67 14 18.5C14 19.33 13.33 20 12.5 20ZM34.5 20C33.67 20 33 19.33 33 18.5C33 17.67 33.67 17 34.5 17C35.33 17 36 17.67 36 18.5C36 19.33 35.33 20 34.5 20ZM37.65 17C37.09 15.82 35.89 15 34.5 15C33.96 15 33.46 15.13 33 15.35V7.99997H35V12C35 13.1 35.9 14 37 14H41V17H37.65Z" fill="currentColor" />
            </svg>
          </div>
        );
      case 'machinery':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-10 w-16 text-blue-600">
              <path fillRule="evenodd" clipRule="evenodd" d="M25.1961 5.63638L29.902 3.02174C31.2681 2.26266 32.9882 2.67963 33.8552 3.98004L39.8685 13H40C42.4853 13 44.5 15.0147 44.5 17.5C44.5 19.9853 42.4853 22 40 22H36V20H38V16.0114L29.8084 10.0952L27 12.026V14H25V16H28C29.6569 16 31 17.3432 31 19C31 20.6569 29.6569 22 28 22H8C6.34314 22 5 20.6569 5 19C5 17.3432 6.34315 16 8 16H14.0858L12.9645 14.8787C12.4019 14.3161 11.6388 14 10.8431 14H5V10C5 8.89546 5.89543 8.00003 7 8.00003H19V4.00003H21.9689C23.2632 4.00003 24.4543 4.62361 25.1961 5.63638ZM30.8733 4.77C31.3287 4.51698 31.9021 4.65597 32.1911 5.08944L32.6211 5.73448L26.9346 9.64394L26.0557 7.44674L30.8733 4.77ZM31.5585 8.89209L33.7306 7.39875L37.6676 13.3042L31.5585 8.89209ZM16.9142 16H23V14H19V10H7V12H10.8431C12.1692 12 13.441 12.5268 14.3787 13.4645L16.9142 16ZM21 6.00003V12H25V10.1926L23.8259 7.25725C23.5221 6.49793 22.7867 6.00003 21.9689 6.00003H21ZM40 20C41.3807 20 42.5 18.8807 42.5 17.5C42.5 16.1193 41.3807 15 40 15V20ZM8 18C7.44772 18 7 18.4477 7 19C7 19.5523 7.44772 20 8 20H9.25V18H8ZM13.25 18H10.75V20H13.25V18ZM17.25 18H14.75V20H17.25V18ZM21.25 18H18.75V20H21.25V18ZM25.25 18H22.75V20H25.25V18ZM28 18H26.75V20H28C28.5523 20 29 19.5523 29 19C29 18.4477 28.5523 18 28 18Z" fill="currentColor" />
            </svg>
          </div>
        );
      case 'agriculture':
        return (
          <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-10 w-16 text-blue-600">
              <path fillRule="evenodd" clipRule="evenodd" d="M17.5 12.75C15.9812 12.75 14.75 13.9812 14.75 15.5C14.75 17.0188 15.9812 18.25 17.5 18.25C19.0188 18.25 20.25 17.0188 20.25 15.5C20.25 13.9812 19.0188 12.75 17.5 12.75ZM16.25 15.5C16.25 14.8096 16.8096 14.25 17.5 14.25
