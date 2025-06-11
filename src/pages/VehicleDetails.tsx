
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Share2, 
  Printer, 
  MapPin, 
  Calendar, 
  Gauge, 
  Fuel, 
  Settings, 
  Shield, 
  FileText,
  Heart,
  Eye
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useTrucks } from "@/hooks/useTrucks";
import { useVehicleSpecifications } from "@/hooks/useVehicleSpecifications";
import { useTranslation } from "react-i18next";

const VehicleDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trucks, isLoading } = useTrucks();
  const [vehicle, setVehicle] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [similarVehicles, setSimilarVehicles] = useState<any[]>([]);
  
  const { data: specifications } = useVehicleSpecifications(id);

  useEffect(() => {
    if (trucks && id) {
      const foundVehicle = trucks.find(truck => truck.id === id);
      if (foundVehicle) {
        setVehicle(foundVehicle);
        setMainImage(foundVehicle.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=800&h=600&fit=crop");
        
        // Find similar vehicles (same category, different vehicle)
        const similar = trucks
          .filter(truck => truck.category === foundVehicle.category && truck.id !== foundVehicle.id)
          .slice(0, 3);
        setSimilarVehicles(similar);
      }
    }
  }, [trucks, id]);

  const handleImageChange = (imageUrl: string) => {
    setMainImage(imageUrl);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle?.brand} ${vehicle?.model}`,
        text: `Check out this ${vehicle?.brand} ${vehicle?.model} for $${vehicle?.price?.toLocaleString()}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Vehicle Not Found</h1>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  const mediaItems = vehicle.images || ["https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=800&h=600&fit=crop"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Back Navigation */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Media */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video relative">
                <img 
                  src={mainImage} 
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-blue-600">
                    {t(`category.${vehicle.category}.title`)}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {}}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleShare}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Thumbnail Carousel */}
            {mediaItems.length > 1 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {mediaItems.map((image, index) => (
                      <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/3 md:basis-1/4">
                        <button
                          onClick={() => handleImageChange(image)}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            mainImage === image ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img 
                            src={image} 
                            alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            )}

            {/* Vehicle Details Tabs */}
            <div className="bg-white rounded-lg shadow-lg">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">{t('vehicleDetails.overview')}</TabsTrigger>
                  <TabsTrigger value="specifications">{t('vehicleDetails.specifications')}</TabsTrigger>
                  <TabsTrigger value="features">{t('vehicleDetails.features')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{t('vehicleDetails.description')}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {vehicle.description || `This ${vehicle.brand} ${vehicle.model} is a reliable ${vehicle.category} vehicle perfect for your business needs. With ${vehicle.year} year model and ${vehicle.mileage?.toLocaleString() || '0'} hours of operation, it offers excellent performance and value.`}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-gray-500">{t('vehicleDetails.year')}</div>
                          <div className="font-semibold">{vehicle.year}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Gauge className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-gray-500">
                            {vehicle.category === 'trucks' ? t('vehicleDetails.mileage') : t('vehicleDetails.operatingHours')}
                          </div>
                          <div className="font-semibold">
                            {vehicle.mileage?.toLocaleString() || '0'} {vehicle.category === 'trucks' ? 'km' : 'hours'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Settings className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-gray-500">{t('vehicleDetails.engine')}</div>
                          <div className="font-semibold">{vehicle.engine}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Fuel className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-gray-500">{t('vehicleDetails.transmission')}</div>
                          <div className="font-semibold">{vehicle.transmission}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="specifications" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{t('vehicleDetails.specifications')}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('vehicleDetails.brand')}:</span>
                          <span className="font-semibold">{vehicle.brand}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('vehicleDetails.model')}:</span>
                          <span className="font-semibold">{vehicle.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('vehicleDetails.condition')}:</span>
                          <span className="font-semibold">{vehicle.condition}</span>
                        </div>
                        {vehicle.horsepower && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('vehicleDetails.horsepower')}:</span>
                            <span className="font-semibold">{vehicle.horsepower} HP</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {specifications && (
                          <>
                            {specifications.fuel_type && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('vehicleDetails.fuelType')}:</span>
                                <span className="font-semibold">{specifications.fuel_type}</span>
                              </div>
                            )}
                            {specifications.drive_type && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t('vehicleDetails.drivetrain')}:</span>
                                <span className="font-semibold">{specifications.drive_type}</span>
                              </div>
                            )}
                            {specifications.operating_weight && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Operating Weight:</span>
                                <span className="font-semibold">{specifications.operating_weight} kg</span>
                              </div>
                            )}
                            {specifications.lifting_capacity && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Lifting Capacity:</span>
                                <span className="font-semibold">{specifications.lifting_capacity} kg</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="features" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{t('vehicleDetails.features')}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {vehicle.features && vehicle.features.length > 0 ? (
                        vehicle.features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{feature}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{vehicle.engine} Engine</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{vehicle.transmission} Transmission</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{vehicle.condition} Condition</span>
                          </div>
                          {specifications?.air_conditioning && (
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Air Conditioning</span>
                            </div>
                          )}
                          {specifications?.abs_brakes && (
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>ABS Brakes</span>
                            </div>
                          )}
                          {specifications?.cruise_control && (
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Cruise Control</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Contact and Actions */}
          <div className="space-y-6">
            {/* Price and Contact Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-2xl text-orange-600">
                  ${vehicle.price?.toLocaleString() || t('vehicleDetails.contactForPrice')}
                </CardTitle>
                <CardDescription>
                  {vehicle.brand} {vehicle.model} • {vehicle.year}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  {t('vehicleDetails.requestQuote')}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {t('vehicleDetails.callNow')}
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {t('vehicleDetails.sendEmail')}
                  </Button>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('vehicleDetails.shareVehicle')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    {t('vehicleDetails.printDetails')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  {t('vehicleDetails.warranty')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{t('vehicleDetails.financing')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{t('vehicleDetails.inspection')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{t('vehicleDetails.history')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  {t('vehicleDetails.vehicleLocation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Joane, Braga, Portugal
                </p>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Vehicles */}
        {similarVehicles.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('vehicleDetails.similarVehicles')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {similarVehicles.map((similar) => (
                <Card key={similar.id} className="group hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/vehicle/${similar.id}`)}>
                  <div className="relative overflow-hidden">
                    <img 
                      src={similar.images?.[0] || "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=400&h=300&fit=crop"} 
                      alt={similar.model} 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{similar.brand} {similar.model}</CardTitle>
                    <CardDescription className="text-xl font-bold text-orange-600">
                      ${similar.price?.toLocaleString()}
                    </CardDescription>
                    <div className="text-sm text-gray-500">
                      {similar.year} • {similar.mileage?.toLocaleString() || '0'} hours
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default VehicleDetails;
