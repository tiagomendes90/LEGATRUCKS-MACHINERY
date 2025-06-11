
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowLeft, Phone, Mail, Share2, Printer, MapPin, Shield, FileText, History } from "lucide-react";
import { useTrucks } from "@/hooks/useTrucks";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useTranslation } from "react-i18next";

const VehicleDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: allTrucks, isLoading, error } = useTrucks();

  const vehicle = allTrucks?.find(truck => truck.id === id);

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

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">{t('common.error')}: {error?.message || 'Vehicle not found'}</div>
        </div>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }

  const handleBackClick = () => {
    navigate(-1);
  };

  const similarVehicles = allTrucks
    ?.filter(truck => truck.category === vehicle.category && truck.id !== vehicle.id)
    .slice(0, 3);

  const handleCallClick = () => {
    window.location.href = `tel:${'351123456789'}`;
  };

  const handleMailClick = () => {
    window.location.href = `mailto:${'info@legar.pt'}`;
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle.brand} ${vehicle.model}`,
        text: vehicle.description,
        url: window.location.href,
      })
      .then(() => console.log('Successful share'))
      .catch((error) => console.error('Error sharing', error));
    } else {
      alert('Web Share API not supported, copy the link to share.');
    }
  };

  const handlePrintClick = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 mt-24">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={handleBackClick}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <Carousel
              opts={{
                loop: true
              }}
              className="w-full"
            >
              <CarouselContent>
                {vehicle.images && vehicle.images.length > 0 ? (
                  vehicle.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                        className="w-full h-96 object-cover rounded-lg"
                      />
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <img
                      src="https://via.placeholder.com/600x400"
                      alt="Placeholder"
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  </CarouselItem>
                )}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-4">{vehicle.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{vehicle.brand} {vehicle.model}</h1>
              <p className="text-2xl text-orange-600 font-semibold">${vehicle.price.toLocaleString()}</p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">{t('vehicleDetails.overview')}</TabsTrigger>
                <TabsTrigger value="specifications">{t('vehicleDetails.specifications')}</TabsTrigger>
                <TabsTrigger value="features">{t('vehicleDetails.features')}</TabsTrigger>
                <TabsTrigger value="description">{t('vehicleDetails.description')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.engine')}</h4>
                    <p className="text-lg">{vehicle.engine}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.transmission')}</h4>
                    <p className="text-lg">{vehicle.transmission}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.year')}</h4>
                    <p className="text-lg">{vehicle.year}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.mileage')}</h4>
                    <p className="text-lg">{vehicle.mileage ? vehicle.mileage.toLocaleString() : '0'} {t('vehicleDetails.hours')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.condition')}</h4>
                    <p className="text-lg">{vehicle.condition}</p>
                  </div>
                  {vehicle.horsepower && (
                    <div>
                      <h4 className="font-semibold text-gray-600">{t('vehicleDetails.horsepower')}</h4>
                      <p className="text-lg">{vehicle.horsepower} HP</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.category')}</h4>
                    <p className="text-lg">{vehicle.category}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.subcategory')}</h4>
                    <p className="text-lg">{vehicle.subcategory}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.brand')}</h4>
                    <p className="text-lg">{vehicle.brand}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">{t('vehicleDetails.model')}</h4>
                    <p className="text-lg">{vehicle.model}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4 mt-6">
                {vehicle.features && vehicle.features.length > 0 ? (
                  <ul className="space-y-2">
                    {vehicle.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">{t('vehicleDetails.noFeatures')}</p>
                )}
              </TabsContent>
              
              <TabsContent value="description" className="space-y-4 mt-6">
                <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
              </TabsContent>
            </Tabs>

            {/* Contact Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleCallClick} className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                {t('vehicleDetails.callNow')}
              </Button>
              <Button onClick={handleMailClick} variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                {t('vehicleDetails.sendEmail')}
              </Button>
              <Button onClick={handleShareClick} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                {t('vehicleDetails.shareVehicle')}
              </Button>
              <Button onClick={handlePrintClick} variant="outline" className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                {t('vehicleDetails.printDetails')}
              </Button>
            </div>
          </div>
        </div>

        {/* Similar Vehicles */}
        {similarVehicles && similarVehicles.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8">{t('vehicleDetails.similarVehicles')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {similarVehicles.map(similarVehicle => (
                <Card key={similarVehicle.id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={similarVehicle.images && similarVehicle.images.length > 0 ? similarVehicle.images[0] : "https://via.placeholder.com/400x200"}
                      alt={similarVehicle.model}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4">{similarVehicle.category}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{similarVehicle.brand} {similarVehicle.model}</CardTitle>
                    <CardDescription className="text-xl text-orange-600 font-semibold">${similarVehicle.price.toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => navigate(`/vehicle/${similarVehicle.id}`)}>
                      {t('common.viewDetails')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Additional Information */}
        <section className="mt-16 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                {t('vehicleDetails.vehicleLocation')}
              </CardTitle>
              <CardDescription>Lisbon, Portugal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center mb-4">
                <span className="text-gray-500">{t('vehicleDetails.mapPlaceholder')}</span>
              </div>
              <Button variant="link" className="p-0">{t('vehicleDetails.viewOnGoogleMaps')}</Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Shield className="h-5 w-5 mr-2" />
                  {t('vehicleDetails.financing')}
                </CardTitle>
                <CardDescription className="text-green-600">{t('vehicleDetails.financingAvailable')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-green-700">{t('vehicleDetails.financingDetails')}</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <FileText className="h-5 w-5 mr-2" />
                  {t('vehicleDetails.warranty')}
                </CardTitle>
                <CardDescription className="text-blue-600">{t('vehicleDetails.warrantyIncluded')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">{t('vehicleDetails.warrantyDetails')}</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <History className="h-5 w-5 mr-2" />
                  {t('vehicleDetails.inspection')}
                </CardTitle>
                <CardDescription className="text-orange-600">{t('vehicleDetails.inspectionReportAvailable')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-orange-700">{t('vehicleDetails.inspectionDetails')}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default VehicleDetails;
