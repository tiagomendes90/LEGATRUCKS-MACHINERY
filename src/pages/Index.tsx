import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Truck } from "lucide-react";
import { useTrucks } from "@/hooks/useTrucks";
import { useFeaturedTrucks } from "@/hooks/useFeaturedTrucks";
import { useBrands } from "@/hooks/useBrands";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Autoplay from "embla-carousel-autoplay";
const Index = () => {
  const {
    data: trucks
  } = useTrucks();
  const {
    data: featuredTrucksData
  } = useFeaturedTrucks();
  const {
    data: allBrands
  } = useBrands();

  // Use featured trucks from database, fallback to first 6 trucks from inventory for carousel
  const featuredTrucks = featuredTrucksData && featuredTrucksData.length > 0 ? featuredTrucksData.map(featured => ({
    id: featured.trucks.id,
    name: `${featured.trucks.brand} ${featured.trucks.model}`,
    type: featured.trucks.category?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Vehicle',
    price: `$${featured.trucks.price.toLocaleString()}`,
    image: featured.trucks.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
    features: featured.trucks.features?.slice(0, 3) || [`${featured.trucks.year} model`, "Premium engine", "Advanced transmission"]
  })) : trucks && trucks.length > 0 ? trucks.slice(0, 6).map(truck => ({
    id: truck.id,
    name: `${truck.brand} ${truck.model}`,
    type: truck.category?.charAt(0).toUpperCase() + truck.category?.slice(1) || 'Vehicle',
    price: `$${truck.price.toLocaleString()}`,
    image: truck.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
    features: truck.features?.slice(0, 3) || [`${truck.year} model`, `${truck.engine} engine`, `${truck.transmission} transmission`]
  })) : [];
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      {/* Hero Section with Full Screen Image */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url('/lovable-uploads/5e2912d0-c74c-4979-91b4-a8a43d2ac24b.png')`
      }}>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="container mx-auto px-6 text-center text-white">
            <h1 className="text-5xl mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent font-extrabold md:text-6xl lg:text-7xl">
              TRUCKS & MACHINERY
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto md:text-2xl">
              100+ NEW TRUCKS AND MACHINES IN STOCK
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg">Contact</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-[120px]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-250 w-250 rounded-3xl ">
                  <path d="M42.79 12.34L40.45 7.65997C39.94 6.63997 38.9 5.99997 37.77 5.99997H33.01V3.99997C33.01 2.89997 32.11 1.99997 31.01 1.99997H7C5.9 1.99997 5 2.89997 5 3.99997V19H9.05C9.3 20.69 10.74 22 12.5 22C14.26 22 15.7 20.69 15.95 19H31.05C31.3 20.69 32.74 22 34.5 22C36.26 22 37.7 20.69 37.95 19H43V13.24C43 12.93 42.93 12.62 42.79 12.35V12.34ZM38.66 8.54997L40.38 12H37V7.99997H37.76C38.14 7.99997 38.48 8.20997 38.65 8.54997H38.66ZM31 3.99997V12H7V3.99997H31ZM7 14H31V17H15.65C15.09 15.82 13.89 15 12.5 15C11.11 15 9.92 15.82 9.35 17H7V14ZM12.5 20C11.67 20 11 19.33 11 18.5C11 17.67 11.67 17 12.5 17C13.33 17 14 17.67 14 18.5C14 19.33 13.33 20 12.5 20ZM34.5 20C33.67 20 33 19.33 33 18.5C33 17.67 33.67 17 34.5 17C35.33 17 36 17.67 36 18.5C36 19.33 35.33 20 34.5 20ZM37.65 17C37.09 15.82 35.89 15 34.5 15C33.96 15 33.46 15.13 33 15.35V7.99997H35V12C35 13.1 35.9 14 37 14H41V17H37.65Z" fill="#3B82F6" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">TRUCKS</h3>
              <p className="text-gray-600 text-xs">Robust vehicles for road transport - from tractor units for heavy loads to rigid and light trucks for urban delivery.</p>
            </div>
            <div className="text-center group">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-250 w-250 rounded-3xl ">
                  <path fillRule="evenodd" clipRule="evenodd" d="M25.1961 5.63638L29.902 3.02174C31.2681 2.26266 32.9882 2.67963 33.8552 3.98004L39.8685 13H40C42.4853 13 44.5 15.0147 44.5 17.5C44.5 19.9853 42.4853 22 40 22H36V20H38V16.0114L29.8084 10.0952L27 12.026V14H25V16H28C29.6569 16 31 17.3432 31 19C31 20.6569 29.6569 22 28 22H8C6.34314 22 5 20.6569 5 19C5 17.3432 6.34315 16 8 16H14.0858L12.9645 14.8787C12.4019 14.3161 11.6388 14 10.8431 14H5V10C5 8.89546 5.89543 8.00003 7 8.00003H19V4.00003H21.9689C23.2632 4.00003 24.4543 4.62361 25.1961 5.63638ZM30.8733 4.77C31.3287 4.51698 31.9021 4.65597 32.1911 5.08944L32.6211 5.73448L26.9346 9.64394L26.0557 7.44674L30.8733 4.77ZM31.5585 8.89209L33.7306 7.39875L37.6676 13.3042L31.5585 8.89209ZM16.9142 16H23V14H19V10H7V12H10.8431C12.1692 12 13.441 12.5268 14.3787 13.4645L16.9142 16ZM21 6.00003V12H25V10.1926L23.8259 7.25725C23.5221 6.49793 22.7867 6.00003 21.9689 6.00003H21ZM40 20C41.3807 20 42.5 18.8807 42.5 17.5C42.5 16.1193 41.3807 15 40 15V20ZM8 18C7.44772 18 7 18.4477 7 19C7 19.5523 7.44772 20 8 20H9.25V18H8ZM13.25 18H10.75V20H13.25V18ZM17.25 18H14.75V20H17.25V18ZM21.25 18H18.75V20H21.25V18ZM25.25 18H22.75V20H25.25V18ZM28 18H26.75V20H28C28.5523 20 29 19.5523 29 19C29 18.4477 28.5523 18 28 18Z" fill="#16A34A" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">MACHINERY</h3>
              <p className="text-gray-600 text-xs">Essential equipment for construction and infrastructure - excavators, loaders, cranes, compactors, and more for digging, lifting, grading, and paving.</p>
            </div>
            <div className="text-center group">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" focusable="false" aria-hidden="true" fill="none" className="h-250 w-250 rounded-3xl ">
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.5 12.75C15.9812 12.75 14.75 13.9812 14.75 15.5C14.75 17.0188 15.9812 18.25 17.5 18.25C19.0188 18.25 20.25 17.0188 20.25 15.5C20.25 13.9812 19.0188 12.75 17.5 12.75ZM16.25 15.5C16.25 14.8096 16.8096 14.25 17.5 14.25C18.1904 14.25 18.75 14.8096 18.75 15.5C18.75 16.1904 18.1904 16.75 17.5 16.75C16.8096 16.75 16.25 16.1904 16.25 15.5Z" fill="#7C3AED" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M13.847 4H12V2H25V4H23.7208L24.7402 7.05821L27 7.24653V5H29V7.4132L32.9124 7.73923C35.2059 7.93036 36.8655 10.0127 36.54 12.2911L36.2016 14.6599C37.2851 15.3755 38 16.6043 38 18C38 20.2091 36.2091 22 34 22C31.7909 22 30 20.2091 30 18H23.5018C22.5223 20.349 20.204 22 17.5 22C13.9101 22 11 19.0899 11 15.5C11 13.7535 11.6888 12.1679 12.8096 11H11.9142L10.7071 12.2071L9.29285 10.7929L11.0857 9H13.1327L13.847 4ZM34 14C34.0922 14 34.1836 14.0031 34.2742 14.0093L34.5601 12.0083C34.7228 10.8691 33.8931 9.82789 32.7463 9.73232L24.2645 9.02551L23.0662 9.82435C22.6343 10.1123 22.174 10.3498 21.6943 10.5342C22.1919 10.9549 22.6255 11.4491 22.9782 12H26C27.1046 12 28 12.8954 28 14V16H30.5351C31.2267 14.8044 32.5194 14 34 14ZM15.153 9H19.1833C20.1705 9 21.1355 8.70781 21.9568 8.16025L22.8098 7.59163L21.6126 4H15.8673L15.153 9ZM26 14H23.8261C23.9398 14.4815 24 14.9837 24 15.5C24 15.6682 23.9936 15.835 23.9811 16H26V14ZM22 15.5C22 13.0147 19.9853 11 17.5 11C15.0147 11 13 13.0147 13 15.5C13 17.9853 15.0147 20 17.5 20C19.9853 20 22 17.9853 22 15.5ZM34 16C32.8954 16 32 16.8954 32 18C32 19.1046 32.8954 20 34 20C35.1046 20 36 19.1046 36 18C36 16.8954 35.1046 16 34 16Z" fill="#7C3AED" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">AGRICULTURE</h3>
              <p className="text-gray-600 text-xs">Agricultural solutions designed to boost productivity — harvesters, plows, seeders, and mowers for every stage of fieldwork.</p>
            </div>
            <div className="text-center group">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" className="h-250 w-250 rounded-3xl ">
                  <path className="fill-orange-600" d="M18.6,22.7v-4h1.7v-2.7h-1.7V5.3h1.7v-2.7h-1.7c-1.5,0-2.7,1.2-2.7,2.7v2.7h-6.3c-1.5,0-2.9.9-3.6,2.2l-3.1,6.2h0c-.2.4-.3.8-.3,1.2v7.7h6.7c.3,2.3,2.3,4,4.6,4s4.3-1.7,4.6-4h1.8v-2.7h-1.7ZM8.4,11.4h0c.2-.5.7-.7,1.2-.7h1v5.3h-4.5l2.3-4.6ZM14,26.7c-1.1,0-2-.9-2-2s.9-2,2-2,2,.9,2,2-.9,2-2,2ZM16,20.5c-.6-.3-1.3-.5-2-.5-1.9,0-3.5,1.1-4.2,2.7h-4.5v-4h5.3c1.5,0,2.7-1.2,2.7-2.7v-5.3h2.7v9.8Z" />
                  <polygon className="fill-none stroke-orange-600 stroke-2" strokeLinecap="round" strokeLinejoin="round" points="39.2 27.8 23.5 27.8 23.5 3.8 33.7 3.8 39.2 9.7 39.2 27.8" />
                  <polygon className="fill-none stroke-orange-600 stroke-2" strokeLinecap="round" strokeLinejoin="round" points="33.7 3.8 33.7 9.8 39.2 9.8 33.7 3.8" />
                  <line className="fill-none stroke-orange-600 stroke-2" strokeLinecap="round" strokeLinejoin="round" x1="27.3" y1="14.8" x2="31.7" y2="14.8" />
                  <line className="fill-none stroke-orange-600 stroke-2" strokeLinecap="round" strokeLinejoin="round" x1="27.3" y1="18.9" x2="35.2" y2="18.9" />
                  <line className="fill-none stroke-orange-600 stroke-2" strokeLinecap="round" strokeLinejoin="round" x1="27.3" y1="23.3" x2="35.2" y2="23.3" />
                  <path className="fill-orange-600" d="M44.9,24c0-1.7-1.1-3.2-2.6-3.7v7.5c1.5-.6,2.6-2,2.6-3.7Z" />
                  <path className="fill-orange-600" d="M56.9,16h-.2l-8-12c-1.2-1.7-3.4-2.3-5.3-1.3l-4.3,2.3,1.9,2,3.7-2c.6-.3,1.4-.2,1.8.4l.6.9-4.8,3.3v3.2l1-.7,10.9,7.9v5.3h-2.7v2.7h5.3c3.3,0,6-2.7,6-6s-2.7-6-6-6ZM45.7,10.5l2.9-2,5.2,7.9-8.1-5.9ZM56.9,25.3v-6.7c1.8,0,3.3,1.5,3.3,3.3s-1.5,3.3-3.3,3.3Z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">WANT TO SELL?</h3>
              <p className="text-gray-600 text-xs">We also buy used trucks, machinery, and agricultural equipment. If you have vehicles or machines for sale, we’re open to offers and evaluations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trucks Carousel */}
      <section className="bg-slate-50 py-[90px]">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">Featured Vehicles</h2>
          {featuredTrucks.length > 0 ? <div className="relative max-w-7xl mx-auto">
              <Carousel opts={{
            align: "start",
            loop: true,
            slidesToScroll: 3,
            breakpoints: {
              '(max-width: 768px)': {
                slidesToScroll: 1
              },
              '(max-width: 1024px)': {
                slidesToScroll: 2
              }
            }
          }} className="w-full">
                <CarouselContent className="-ml-4">
                  {featuredTrucks.map((vehicle, index) => <CarouselItem key={vehicle.id || index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                      <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                        <div className="relative overflow-hidden">
                          <img src={vehicle.image} alt={vehicle.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                          <Badge className="absolute top-4 left-4 bg-blue-600">{vehicle.type}</Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl">{vehicle.name}</CardTitle>
                          <CardDescription className="text-2xl font-bold text-orange-600">{vehicle.price}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 mb-4">
                            {vehicle.features.map((feature, index) => <li key={index} className="text-sm text-gray-600 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                {feature}
                              </li>)}
                          </ul>
                          <Button className="w-full bg-slate-800 hover:bg-slate-700">View Details</Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>)}
                </CarouselContent>
                <CarouselPrevious className="-left-12 top-1/2 -translate-y-1/2" />
                <CarouselNext className="-right-12 top-1/2 -translate-y-1/2" />
              </Carousel>
            </div> : <div className="text-center py-16">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Featured Vehicles</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No vehicles are currently featured. Add some vehicles to your inventory or set featured vehicles in the admin panel.
              </p>
            </div>}
        </div>
      </section>

      {/* Vehicle Brands Carousel */}
      <section className="bg-white px-0 py-[30px]">
        <div className="container mx-auto py-0 my-0 px-[24px]">
          <div className="flex justify-center">
            <Carousel opts={{
            align: "start",
            loop: true,
            slidesToScroll: 1
          }} plugins={[Autoplay({
            delay: 2000
          })]} className="w-full max-w-5xl">
              <CarouselContent className="-ml-2 md:-ml-4">
                {allBrands && allBrands.length > 0 ? allBrands.map((brand, index) => <CarouselItem key={brand.id} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card className="border-0 shadow-none">
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <div className="text-center">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 48 24" fill="currentColor">
                                <path d="M42.79 12.34L40.45 7.65997C39.94 6.63997 38.9 5.99997 37.77 5.99997H33.01V3.99997C33.01 2.89997 32.11 1.99997 31.01 1.99997H7C5.9 1.99997 5 2.89997 5 3.99997V19H9.05C9.3 20.69 10.74 22 12.5 22C14.26 22 15.7 20.69 15.95 19H31.05C31.3 20.69 32.74 22 34.5 22C36.26 22 37.7 20.69 37.95 19H43V13.24C43 12.93 42.93 12.62 42.79 12.35V12.34ZM38.66 8.54997L40.38 12H37V7.99997H37.76C38.14 7.99997 38.48 8.20997 38.65 8.54997H38.66ZM31 3.99997V12H7V3.99997H31ZM7 14H31V17H15.65C15.09 15.82 13.89 15 12.5 15C11.11 15 9.92 15.82 9.35 17H7V14ZM12.5 20C11.67 20 11 19.33 11 18.5C11 17.67 11.67 17 12.5 17C13.33 17 14 17.67 14 18.5C14 19.33 13.33 20 12.5 20ZM34.5 20C33.67 20 33 19.33 33 18.5C33 17.67 33.67 17 34.5 17C35.33 17 36 17.67 36 18.5C36 19.33 35.33 20 34.5 20ZM37.65 17C37.09 15.82 35.89 15 34.5 15C33.96 15 33.46 15.13 33 15.35V7.99997H35V12C35 13.1 35.9 14 37 14H41V17H37.65Z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">
                              {brand.name}
                            </h3>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>) :
              // Fallback brands if no brands in database
              ['Volvo', 'Scania', 'Mercedes', 'MAN', 'Iveco', 'DAF'].map((brand, index) => <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card className="border-0 shadow-none">
                        <CardContent className="flex aspect-square items-center justify-center p-6 py-0 px-0">
                          <div className="text-center">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 48 24" fill="currentColor">
                                <path d="M42.79 12.34L40.45 7.65997C39.94 6.63997 38.9 5.99997 37.77 5.99997H33.01V3.99997C33.01 2.89997 32.11 1.99997 31.01 1.99997H7C5.9 1.99997 5 2.89997 5 3.99997V19H9.05C9.3 20.69 10.74 22 12.5 22C14.26 22 15.7 20.69 15.95 19H31.05C31.3 20.69 32.74 22 34.5 22C36.26 22 37.7 20.69 37.95 19H43V13.24C43 12.93 42.93 12.62 42.79 12.35V12.34ZM38.66 8.54997L40.38 12H37V7.99997H37.76C38.14 7.99997 38.48 8.20997 38.65 8.54997H38.66ZM31 3.99997V12H7V3.99997H31ZM7 14H31V17H15.65C15.09 15.82 13.89 15 12.5 15C11.11 15 9.92 15.82 9.35 17H7V14ZM12.5 20C11.67 20 11 19.33 11 18.5C11 17.67 11.67 17 12.5 17C13.33 17 14 17.67 14 18.5C14 19.33 13.33 20 12.5 20ZM34.5 20C33.67 20 33 19.33 33 18.5C33 17.67 33.67 17 34.5 17C35.33 17 36 17.67 36 18.5C36 19.33 35.33 20 34.5 20ZM37.65 17C37.09 15.82 35.89 15 34.5 15C33.96 15 33.46 15.13 33 15.35V7.99997H35V12C35 13.1 35.9 14 37 14H41V17H37.65Z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">
                              {brand}
                            </h3>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>)}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;