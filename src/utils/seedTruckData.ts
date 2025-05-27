
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Comprehensive realistic truck data for different categories
const truckSeedData = [
  // Heavy-duty trucks (10 entries)
  {
    brand: "Volvo",
    model: "FH16 750",
    year: 2023,
    mileage: 12500,
    price: 185000,
    condition: "new",
    engine: "Volvo D16K 750",
    transmission: "I-Shift",
    description: "The Volvo FH16 750 is our most powerful truck, designed for the most demanding operations and heaviest transports. Features a 750 hp engine with 3550 Nm of torque, I-Shift transmission with crawler gears, and Volvo Dynamic Steering for precise handling.",
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
    description: "The Scania R730 V8 is a flagship model with a powerful V8 engine delivering 730 hp and 3500 Nm of torque. Features Scania Opticruise transmission, retarder, and advanced driver support systems for optimal performance and safety.",
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
    description: "The Mercedes-Benz Actros 2653 is designed for long-haul transport with its 530 hp engine and PowerShift 3 automated transmission. Features MirrorCam instead of conventional mirrors, Predictive Powertrain Control, and Active Brake Assist 5.",
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
  {
    brand: "Peterbilt",
    model: "579",
    year: 2024,
    mileage: 8900,
    price: 195000,
    condition: "new",
    engine: "PACCAR MX-13",
    transmission: "automated-manual",
    description: "The Peterbilt 579 combines aerodynamic efficiency with classic styling. Featuring PACCAR MX-13 engine with 500 hp, automated manual transmission, and advanced SmartNav technology for optimal fuel efficiency and driver comfort.",
    horsepower: 500,
    features: ["SmartNav Technology", "EPIQ Dashboard", "SmartAir 2", "Bendix Wingman Fusion", "Diamond VIT Interior", "LED Lighting Package", "Air Suspension"],
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "DAF",
    model: "XF 530",
    year: 2022,
    mileage: 35600,
    price: 165000,
    condition: "certified",
    engine: "PACCAR MX-13",
    transmission: "TraXon",
    description: "The DAF XF 530 delivers exceptional fuel efficiency and driver comfort with its PACCAR MX-13 engine and TraXon automated transmission. Features advanced safety systems and spacious SuperSpace Cab for long-haul operations.",
    horsepower: 530,
    features: ["Predictive Cruise Control", "Lane Departure Warning", "Forward Collision Warning", "SuperSpace Cab", "Multimedia System", "Automatic Climate Control", "Xenon Headlights"],
    images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1592805723127-004b174a1798?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "Iveco",
    model: "S-Way 570",
    year: 2023,
    mileage: 19800,
    price: 172000,
    condition: "used",
    engine: "Cursor 13",
    transmission: "Hi-Tronix",
    description: "The Iveco S-Way 570 features a Cursor 13 engine with 570 hp and Hi-Tronix automated transmission. Designed for maximum fuel efficiency and driver comfort with innovative cab design and advanced connectivity features.",
    horsepower: 570,
    features: ["ADAS Advanced Safety", "Connected Services", "Hi-Comfort Suspension", "Automatic Climate Control", "Infotainment System", "LED DRL", "Ergonomic Dashboard"],
    images: ["https://images.unsplash.com/photo-1566152960884-5a266668e5ed?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1570327920356-811d8dd4d58d?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "Mack",
    model: "Anthem 505",
    year: 2021,
    mileage: 68500,
    price: 142000,
    condition: "used",
    engine: "Mack MP8",
    transmission: "mDRIVE HD",
    description: "The Mack Anthem 505 is built for the long haul with its reliable MP8 engine and mDRIVE HD automated transmission. Features aerodynamic design, spacious interior, and Mack's legendary durability for demanding applications.",
    horsepower: 505,
    features: ["Bendix Wingman Fusion", "mDRIVE HD Transmission", "Command Steer", "Mack Connect", "LED Headlights", "Air Suspension", "Premium Interior"],
    images: ["https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1592805723127-004b174a1798?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },
  {
    brand: "Western Star",
    model: "5700XE",
    year: 2024,
    mileage: 3200,
    price: 187000,
    condition: "new",
    engine: "Detroit DD15",
    transmission: "DT12",
    description: "The Western Star 5700XE combines aerodynamic efficiency with rugged styling. Features Detroit DD15 engine with 525 hp, DT12 automated transmission, and advanced safety technologies for superior performance and fuel economy.",
    horsepower: 525,
    features: ["Detroit Assurance 5.0", "Virtual Technician", "Intelligent Powertrain Management", "Premium LED Lighting", "Air Suspension", "Ergonomic Interior", "Advanced Telematics"],
    images: ["https://images.unsplash.com/photo-1626676708484-402819bd986e?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1595758228881-53eca2114ba7?w=800&h=500&fit=crop"],
    category: "heavy-duty"
  },

  // Medium-duty trucks (10 entries)
  {
    brand: "Freightliner",
    model: "M2 106",
    year: 2024,
    mileage: 3200,
    price: 125000,
    condition: "new",
    engine: "Cummins B6.7",
    transmission: "Allison Automatic",
    description: "The Freightliner M2 106 is a versatile medium-duty truck powered by a Cummins B6.7 engine with 300 hp and Allison automatic transmission. Offers excellent visibility, maneuverability, and comfort for regional and urban delivery operations.",
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
    description: "The Isuzu FTR is powered by a 5.2L turbocharged engine with 215 hp and Allison automatic transmission. Features a tight turning radius, spacious cab, and excellent visibility, making it ideal for urban delivery and regional distribution.",
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
    description: "The Hino 268A is equipped with a J08E-VB engine delivering 230 hp and automatic transmission. Offers excellent fuel efficiency, driver comfort, and a comprehensive standard safety package for distribution and delivery applications.",
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
    description: "The Ford F-650 features a 6.7L Power Stroke V8 diesel engine with 330 hp and TorqShift HD automatic transmission. Offers exceptional capability and versatility for a wide range of commercial applications and body upfits.",
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
    description: "The Mitsubishi Fuso FE160 is powered by a 4P10 turbodiesel engine with 161 hp and Duonic 2.0 dual-clutch automated manual transmission. Features excellent fuel efficiency, maneuverability, and payload capacity for urban delivery operations.",
    horsepower: 161,
    features: ["Duonic 2.0 Dual-Clutch Transmission", "ECO Mode", "Bluetooth Radio", "LED Headlamps", "Cruise Control", "Keyless Entry", "Driver's Suspension Seat"],
    images: ["https://images.unsplash.com/photo-1562876614-b8113b9aae14?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1565776877935-72d7a6dc421a?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "International",
    model: "MV607",
    year: 2024,
    mileage: 2800,
    price: 108000,
    condition: "new",
    engine: "Cummins B6.7",
    transmission: "Allison 2500",
    description: "The International MV607 combines proven Cummins B6.7 power with Allison automatic transmission for reliable medium-duty performance. Features advanced safety systems, comfortable cab design, and excellent fuel economy for delivery applications.",
    horsepower: 285,
    features: ["Electronic Stability Control", "Anti-Lock Braking System", "Traction Control", "Cruise Control", "Air Conditioning", "Power Steering", "Bluetooth Connectivity"],
    images: ["https://images.unsplash.com/photo-1601312378427-822b2b41da35?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1586368555537-a8be1231d20f?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Volvo",
    model: "VNM 300",
    year: 2023,
    mileage: 12600,
    price: 118000,
    condition: "certified",
    engine: "Volvo D8K",
    transmission: "I-Shift",
    description: "The Volvo VNM 300 delivers European engineering excellence with the D8K engine and I-Shift automated transmission. Features advanced safety systems, exceptional fuel efficiency, and driver-centric design for medium-duty applications.",
    horsepower: 300,
    features: ["I-Shift Automated Manual", "Enhanced Stability Program", "Driver Alert Support", "Lane Keeping Aid", "Volvo Connect", "LED Lighting", "Ergonomic Interior"],
    images: ["https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1592805723127-004b174a1798?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Kenworth",
    model: "T370",
    year: 2022,
    mileage: 34200,
    price: 95000,
    condition: "used",
    engine: "PACCAR PX-7",
    transmission: "Allison 3000",
    description: "The Kenworth T370 features a PACCAR PX-7 engine with 325 hp and Allison 3000 automatic transmission. Built for versatility and durability with premium interior appointments and advanced safety features for demanding work environments.",
    horsepower: 325,
    features: ["PACCAR PX-7 Engine", "Allison 3000 Transmission", "Air Suspension", "Premium Interior", "Advanced Safety Package", "Electronic Controls", "Ergonomic Design"],
    images: ["https://images.unsplash.com/photo-1600661653561-629509216228?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1566152960884-5a266668e5ed?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Peterbilt",
    model: "220",
    year: 2024,
    mileage: 4500,
    price: 112000,
    condition: "new",
    engine: "PACCAR PX-7",
    transmission: "Allison 2500",
    description: "The Peterbilt 220 combines classic styling with modern efficiency. Features PACCAR PX-7 engine, Allison automatic transmission, and premium amenities designed for driver comfort and operational efficiency in medium-duty applications.",
    horsepower: 300,
    features: ["SmartNav Technology", "Premium Interior", "Air Suspension Seats", "Advanced Safety Systems", "LED Lighting Package", "Bluetooth Connectivity", "Ergonomic Controls"],
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1570327920356-811d8dd4d58d?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },
  {
    brand: "Mercedes-Benz",
    model: "Atego 1218",
    year: 2023,
    mileage: 16900,
    price: 102000,
    condition: "used",
    engine: "OM 934",
    transmission: "G85-6",
    description: "The Mercedes-Benz Atego 1218 features the reliable OM 934 engine with 175 hp and manual transmission. Known for exceptional build quality, fuel efficiency, and versatility for urban distribution and regional transport applications.",
    horsepower: 175,
    features: ["Active Brake Assist", "Attention Assist", "Electronic Stability Program", "Comfort Suspension", "Multimedia System", "Air Conditioning", "Ergonomic Workplace"],
    images: ["https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1616455579100-2ceaa4eb2d99?w=800&h=500&fit=crop"],
    category: "medium-duty"
  },

  // Light-duty trucks (10 entries)
  {
    brand: "Ford",
    model: "F-550 Super Duty",
    year: 2024,
    mileage: 4500,
    price: 78000,
    condition: "new",
    engine: "Power Stroke V8",
    transmission: "automatic",
    description: "The Ford F-550 Super Duty features a 6.7L Power Stroke V8 turbo diesel engine with 475 hp and automatic transmission. Offers impressive towing and payload capabilities, making it ideal for commercial and construction applications.",
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
    description: "The Chevrolet Silverado 3500HD is powered by a Duramax 6.6L turbo-diesel V8 engine with 445 hp and Allison 10-speed automatic transmission. Offers exceptional towing and hauling capabilities for commercial work and fleet applications.",
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
    description: "The RAM 5500 Chassis Cab features a Cummins 6.7L turbo diesel engine with 360 hp and AISIN 6-speed automatic transmission. Offers exceptional capability, durability, and versatility for a wide range of commercial upfits and applications.",
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
    description: "The GMC Sierra 3500HD is powered by a Duramax 6.6L turbo diesel engine with 445 hp and Allison 10-speed automatic transmission. Features ProGrade Trailering technology, MultiPro tailgate, and premium interior appointments for commercial applications.",
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
    description: "The Isuzu NPR-HD is equipped with a 4HK1-TC turbocharged diesel engine with 215 hp and automatic transmission. Offers excellent maneuverability, visibility, and reliability for urban delivery and service applications.",
    horsepower: 215,
    features: ["Keyless Entry", "Power Windows and Locks", "Air Conditioning", "Multi-Information Display", "Bluetooth Audio", "Trip Computer", "Cruise Control"],
    images: ["https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1570058695872-9acb06dab0be?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "Ford",
    model: "Transit-350 HD",
    year: 2024,
    mileage: 2100,
    price: 62000,
    condition: "new",
    engine: "Power Stroke V6",
    transmission: "SelectShift",
    description: "The Ford Transit-350 HD features a 3.2L Power Stroke V6 diesel engine with 185 hp and SelectShift automatic transmission. Designed for maximum cargo capacity and fuel efficiency with advanced connectivity and safety features.",
    horsepower: 185,
    features: ["SYNC 4", "Ford Co-Pilot360", "Intelligent 4WD", "Cargo Management System", "Rear View Camera", "LED Headlights", "Dual Zone Climate Control"],
    images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1570327920356-811d8dd4d58d?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "Nissan",
    model: "NV200 Compact Cargo",
    year: 2023,
    mileage: 24600,
    price: 35000,
    condition: "certified",
    engine: "2.0L 4-Cylinder",
    transmission: "CVT",
    description: "The Nissan NV200 Compact Cargo offers efficiency and versatility with its 2.0L 4-cylinder engine and CVT transmission. Perfect for urban delivery with excellent fuel economy, compact size, and surprising cargo capacity.",
    horsepower: 131,
    features: ["NissanConnect", "Bluetooth Connectivity", "Dual Sliding Doors", "Flat Load Floor", "Overhead Storage", "Mobile Office Package", "Rear Doors 180° Opening"],
    images: ["https://images.unsplash.com/photo-1562876614-b8113b9aae14?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1616455579100-2ceaa4eb2d99?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "Mercedes-Benz",
    model: "Sprinter 3500",
    year: 2024,
    mileage: 3800,
    price: 68000,
    condition: "new",
    engine: "OM 651 Turbo",
    transmission: "7G-TRONIC",
    description: "The Mercedes-Benz Sprinter 3500 features an OM 651 turbocharged engine with 188 hp and 7G-TRONIC automatic transmission. Offers exceptional cargo capacity, advanced safety features, and connectivity for commercial applications.",
    horsepower: 188,
    features: ["MBUX Multimedia System", "Active Brake Assist", "Crosswind Assist", "Lane Keeping Assist", "Blind Spot Assist", "Load Adaptive ESP", "High Roof Configuration"],
    images: ["https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1566152960884-5a266668e5ed?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "Freightliner",
    model: "Sprinter 2500",
    year: 2023,
    mileage: 16200,
    price: 55000,
    condition: "used",
    engine: "Mercedes OM 651",
    transmission: "7G-TRONIC",
    description: "The Freightliner Sprinter 2500 combines Mercedes engineering with American market optimization. Features OM 651 engine, 7G-TRONIC transmission, and versatile cargo configuration for diverse commercial applications.",
    horsepower: 188,
    features: ["Crosswind Assist", "Active Brake Assist", "Attention Assist", "ECO Start/Stop", "Load Adaptive ESP", "Cargo Area LED Lighting", "Easy Entry System"],
    images: ["https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1586368555537-a8be1231d20f?w=800&h=500&fit=crop"],
    category: "light-duty"
  },
  {
    brand: "Chevrolet",
    model: "Express 3500",
    year: 2022,
    mileage: 29800,
    price: 48000,
    condition: "used",
    engine: "Vortec 6.0L V8",
    transmission: "6-Speed Automatic",
    description: "The Chevrolet Express 3500 is powered by a reliable Vortec 6.0L V8 engine with 342 hp and 6-speed automatic transmission. Offers excellent payload capacity, durability, and proven performance for commercial fleet applications.",
    horsepower: 342,
    features: ["StabiliTrak Electronic Stability Control", "Traction Control", "OnStar", "Remote Keyless Entry", "Power Door Locks", "Auxiliary Lighting", "Heavy-Duty Trailering Package"],
    images: ["https://images.unsplash.com/photo-1568559598349-dbf322d0e338?w=800&h=500&fit=crop", "https://images.unsplash.com/photo-1570058695872-9acb06dab0be?w=800&h=500&fit=crop"],
    category: "light-duty"
  }
];

// Function to seed the database with predefined truck data
export const seedTruckDatabase = async () => {
  try {
    console.log("Starting to seed database with 30 realistic truck entries...");
    
    // Clear existing data first
    const { error: deleteError } = await supabase
      .from('trucks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all existing trucks
    
    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 is "no rows found" which is fine
      console.error("Error clearing existing trucks:", deleteError);
    }
    
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
      description: "Added 30 realistic truck entries to the database!",
      variant: "default",
    });
    
    console.log("Successfully seeded database with 30 trucks");
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
