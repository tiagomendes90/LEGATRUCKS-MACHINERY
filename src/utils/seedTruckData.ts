import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Realistic truck data for different categories
const truckSeedData = [
  // Heavy-duty trucks
  {
    brand: "Volvo",
    model: "FH16 750",
    year: 2023,
    mileage: 12500,
    price: 185000,
    condition: "new",
    engine: "Volvo D16K 750",
    transmission: "I-Shift",
    description: "The Volvo FH16 750 is our most powerful truck, designed for the most demanding operations and heaviest transports. It features a 750 hp engine with 3550 Nm of torque, I-Shift transmission with crawler gears, and Volvo Dynamic Steering for precise handling.",
    horsepower: 750,
    features: ["GPS Navigation", "Driver Alert Support", "Lane Keeping Aid", "Adaptive Cruise Control", "Premium Sound System", "Leather Interior", "Refrigerator"],
    images: ["https://images.unsplash.com/photo-1592805723127-004b174a1798?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "Scania",
    model: "R730 V8",
    year: 2024,
    mileage: 5800,
    price: 198500,
    condition: "new",
    engine: "Scania V8",
    transmission: "Opticruise",
    description: "The Scania R730 V8 is a flagship model with a powerful V8 engine delivering 730 hp and 3500 Nm of torque. It features Scania Opticruise transmission, retarder, and advanced driver support systems for optimal performance and safety.",
    horsepower: 730,
    features: ["Premium Connectivity", "Advanced Safety Package", "V8 Premium Sound", "Leather Interior", "Dual Refrigerators", "Microwave", "Coffee Machine"],
    images: ["https://images.unsplash.com/photo-1592839843682-f5865509bdf8?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "Mercedes-Benz",
    model: "Actros 2653",
    year: 2023,
    mileage: 18200,
    price: 178000,
    condition: "used",
    engine: "OM 473",
    transmission: "PowerShift 3",
    description: "The Mercedes-Benz Actros 2653 is designed for long-haul transport with its 530 hp engine and PowerShift 3 automated transmission. It features MirrorCam instead of conventional mirrors, Predictive Powertrain Control, and Active Brake Assist 5.",
    horsepower: 530,
    features: ["MirrorCam", "Multimedia Cockpit", "Predictive Powertrain Control", "Active Brake Assist 5", "Proximity Control", "Attention Assist", "LED Headlights"],
    images: ["https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1601312378427-822b2b41da35?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "MAN",
    model: "TGX 18.640",
    year: 2022,
    mileage: 42500,
    price: 159000,
    condition: "used",
    engine: "D3876",
    transmission: "automated-manual",
    description: "The MAN TGX 18.640 is equipped with a 640 hp D3876 engine and automated manual transmission, delivering impressive power and efficiency for heavy transport. Features include a digital cockpit, advanced driver assistance systems, and comfortable living area.",
    horsepower: 640,
    features: ["Digital Cockpit", "EfficientCruise", "Lane Return Assist", "Turn Assist", "12.3-inch Display", "LED Headlights", "Long Haul Package"],
    images: ["https://images.unsplash.com/photo-1595758228881-53eca2114ba7?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1626676708484-402819bd986e?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "Kenworth",
    model: "W990",
    year: 2023,
    mileage: 24800,
    price: 189000,
    condition: "certified",
    engine: "PACCAR MX-13",
    transmission: "automated-manual",
    description: "The Kenworth W990 features a PACCAR MX-13 engine with 510 hp and automated manual transmission. With its classic long-hood design, premium interior, and advanced technology, it offers both style and performance for long-haul operations.",
    horsepower: 510,
    features: ["12.9L PACCAR MX-13 Engine", "76-inch Sleeper", "Premium Interior", "Driver Performance Center", "Digital Dash Display", "Predictive Cruise Control", "Advanced Connectivity"],
    images: ["https://images.unsplash.com/photo-1600661653561-629509216228?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1601581875039-e899893d520c?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  
  // Medium-duty trucks
  {
    brand: "Freightliner",
    model: "M2 106",
    year: 2024,
    mileage: 3200,
    price: 125000,
    condition: "new",
    engine: "Cummins B6.7",
    transmission: "Allison Automatic",
    description: "The Freightliner M2 106 is a versatile medium-duty truck powered by a Cummins B6.7 engine with 300 hp and Allison automatic transmission. It offers excellent visibility, maneuverability, and comfort for regional and urban delivery operations.",
    horsepower: 300,
    features: ["360° Visibility", "SmartPlex Electrical System", "Ergonomic Dashboard", "Bluetooth Connectivity", "Air Suspension Seats", "Collision Mitigation", "LED Lighting"],
    images: ["https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1532976789241-e31cc4c7c16c?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Isuzu",
    model: "FTR",
    year: 2023,
    mileage: 8700,
    price: 98500,
    condition: "used",
    engine: "Isuzu 5.2L",
    transmission: "automatic",
    description: "The Isuzu FTR is powered by a 5.2L turbocharged engine with 215 hp and Allison automatic transmission. It features a tight turning radius, spacious cab, and excellent visibility, making it ideal for urban delivery and regional distribution.",
    horsepower: 215,
    features: ["Hill Start Aid", "Tight Turning Radius", "Low-Cab Forward Design", "6-Speed Automatic", "Heated Mirrors", "Entry/Exit Grab Handles", "Air Suspension Driver's Seat"],
    images: ["https://images.unsplash.com/photo-1566152960884-5a266668e5ed?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1616455579100-2ceaa4eb2d99?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Hino",
    model: "268A",
    year: 2022,
    mileage: 28500,
    price: 88000,
    condition: "certified",
    engine: "Hino J08E-VB",
    transmission: "automatic",
    description: "The Hino 268A is equipped with a J08E-VB engine delivering 230 hp and automatic transmission. It offers excellent fuel efficiency, driver comfort, and a comprehensive standard safety package for distribution and delivery applications.",
    horsepower: 230,
    features: ["Collision Mitigation System", "Lane Departure Warning", "Electronic Stability Control", "Bluetooth Hands-Free", "Driver's Airbag", "Air Conditioning", "Cruise Control"],
    images: ["https://images.unsplash.com/photo-1586368555537-a8be1231d20f?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1570327920356-811d8dd4d58d?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Ford",
    model: "F-650",
    year: 2024,
    mileage: 1200,
    price: 115000,
    condition: "new",
    engine: "Power Stroke V8",
    transmission: "TorqShift HD",
    description: "The Ford F-650 features a 6.7L Power Stroke V8 diesel engine with 330 hp and TorqShift HD automatic transmission. It offers exceptional capability and versatility for a wide range of commercial applications and body upfits.",
    horsepower: 330,
    features: ["Tow/Haul Mode", "Upfitter Switches", "Power Equipment Group", "Air Conditioning", "Tilt/Telescoping Steering Column", "Auxiliary Audio Input", "110V Power Outlet"],
    images: ["https://images.unsplash.com/photo-1522763866081-5be09778cd8b?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Mitsubishi",
    model: "Fuso FE160",
    year: 2023,
    mileage: 15800,
    price: 85000,
    condition: "used",
    engine: "4P10 Turbodiesel",
    transmission: "Duonic 2.0",
    description: "The Mitsubishi Fuso FE160 is powered by a 4P10 turbodiesel engine with 161 hp and Duonic 2.0 dual-clutch automated manual transmission. It features excellent fuel efficiency, maneuverability, and payload capacity for urban delivery operations.",
    horsepower: 161,
    features: ["Duonic 2.0 Dual-Clutch Transmission", "ECO Mode", "Bluetooth Radio", "LED Headlamps", "Cruise Control", "Keyless Entry", "Driver's Suspension Seat"],
    images: ["https://images.unsplash.com/photo-1562876614-b8113b9aae14?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1565776877935-72d7a6dc421a?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  
  // Light-duty trucks
  {
    brand: "Ford",
    model: "F-550 Super Duty",
    year: 2024,
    mileage: 4500,
    price: 78000,
    condition: "new",
    engine: "Power Stroke V8",
    transmission: "automatic",
    description: "The Ford F-550 Super Duty features a 6.7L Power Stroke V8 turbo diesel engine with 475 hp and automatic transmission. It offers impressive towing and payload capabilities, making it ideal for commercial and construction applications.",
    horsepower: 475,
    features: ["Trailer Sway Control", "Tow/Haul Mode", "Power-Adjustable Pedals", "Rearview Camera", "SYNC 4", "FordPass Connect", "Pre-Collision Assist"],
    images: ["https://images.unsplash.com/photo-1579255982490-c8189860977e?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "Chevrolet",
    model: "Silverado 3500HD",
    year: 2023,
    mileage: 12800,
    price: 72000,
    condition: "used",
    engine: "Duramax 6.6L",
    transmission: "Allison 10-Speed",
    description: "The Chevrolet Silverado 3500HD is powered by a Duramax 6.6L turbo-diesel V8 engine with 445 hp and Allison 10-speed automatic transmission. It offers exceptional towing and hauling capabilities for commercial work and fleet applications.",
    horsepower: 445,
    features: ["Advanced Trailering System", "15 Camera Views", "Multi-Flex Tailgate", "Head-Up Display", "Trailer Brake Controller", "Digital Variable Steering Assist", "Auto-Locking Differential"],
    images: ["https://images.unsplash.com/photo-1568559598349-dbf322d0e338?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "RAM",
    model: "5500 Chassis Cab",
    year: 2022,
    mileage: 32500,
    price: 65000,
    condition: "certified",
    engine: "Cummins 6.7L",
    transmission: "AISIN 6-Speed",
    description: "The RAM 5500 Chassis Cab features a Cummins 6.7L turbo diesel engine with 360 hp and AISIN 6-speed automatic transmission. It offers exceptional capability, durability, and versatility for a wide range of commercial upfits and applications.",
    horsepower: 360,
    features: ["Trailer Sway Damping", "Auxiliary Switches", "Uconnect 5", "Active-Level Four-Corner Air Suspension", "360° Surround View Camera", "Lane Keep Assist", "Adaptive Cruise Control"],
    images: ["https://images.unsplash.com/photo-1558383817-c655269fb68f?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "GMC",
    model: "Sierra 3500HD",
    year: 2024,
    mileage: 8200,
    price: 76000,
    condition: "new",
    engine: "Duramax 6.6L",
    transmission: "Allison 10-Speed",
    description: "The GMC Sierra 3500HD is powered by a Duramax 6.6L turbo diesel engine with 445 hp and Allison 10-speed automatic transmission. It features ProGrade Trailering technology, MultiPro tailgate, and premium interior appointments for commercial applications.",
    horsepower: 445,
    features: ["ProGrade Trailering System", "MultiPro Tailgate", "Premium Interior", "15-inch Diagonal Head-Up Display", "High Definition Surround Vision", "Advanced Trailer System", "Denali Ultimate Package"],
    images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "Isuzu",
    model: "NPR-HD",
    year: 2023,
    mileage: 18500,
    price: 58000,
    condition: "used",
    engine: "Isuzu 4HK1-TC",
    transmission: "automatic",
    description: "The Isuzu NPR-HD is equipped with a 4HK1-TC turbocharged diesel engine with 215 hp and automatic transmission. It offers excellent maneuverability, visibility, and reliability for urban delivery and service applications.",
    horsepower: 215,
    features: ["Keyless Entry", "Power Windows and Locks", "Air Conditioning", "Multi-Information Display", "Bluetooth Audio", "Trip Computer", "Cruise Control"],
    images: ["https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1570058695872-9acb06dab0be?w=800&h=500&fit=crop"],
    category: "light-duty"
  }
];

// Function to seed the database with predefined truck data
export const seedTruckDatabase = async () => {
  try {
    console.log("Starting to seed database with sample trucks...");
    
    // Insert each truck into the database
    for (const truck of truckSeedData) {
      const { error } = await supabase
        .from('trucks')
        .insert([truck]);
      
      if (error) {
        console.error("Error inserting truck:", error);
        toast({
          title: "Error",
          description: `Failed to add truck ${truck.brand} ${truck.model}: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    toast({
      title: "Success",
      description: "Added 15 sample trucks to the database!",
      variant: "default",
    });
    
    console.log("Successfully seeded database with 15 trucks");
  } catch (error: any) {
    toast({
      title: "Error",
      description: `Failed to seed database: ${error.message}`,
      variant: "destructive",
    });
    console.error("Error seeding database:", error);
  }
};

// Auto-run the seeding function when this module is imported
seedTruckDatabase();
