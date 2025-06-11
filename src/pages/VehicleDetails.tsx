
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
      
      {/* Add proper spacing to push content below navbar */}
      <div className="container mx-auto px-6 py-8 mt-20">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={handleBackClick}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        {/* Vehicle Details */}
        <Card className="overflow-hidden">
          {/* Image Carousel */}
          <div className="relative">
            <Carousel
              opts={{
                loop: true
              }}
              className="w-full"
            >
              <CarouselContent className="w-full">
                {vehicle.images && vehicle.images.length > 0 ? (
                  vehicle.images.map((image, index) => (
                    <CarouselItem key={index} className="w-full">
                      <img
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-96 object-cover"
                      />
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem className="w-full">
                    <img
                      src="https://via.placeholder.com/800x400"
                      alt="Placeholder"
                      className="w-full h-96 object-cover"
                    />
                  </CarouselItem>
                )}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/50 text-gray-800" />
              <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/50 text-gray-800" />
            </Carousel>
            <Badge className="absolute top-4 left-4 bg-blue-600 z-10">{vehicle.category}</Badge>
          </div>

          <CardHeader>
            <CardTitle className="text-2xl font-bold">{vehicle.brand} {vehicle.model}</CardTitle>
            <CardDescription className="text-xl text-orange-600">${vehicle.price.toLocaleString()}</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">{t('vehicleDetails.overview')}</TabsTrigger>
                <TabsTrigger value="specifications">{t('vehicleDetails.specifications')}</TabsTrigger>
                <TabsTrigger value="features">{t('vehicleDetails.features')}</TabsTrigger>
                <TabsTrigger value="description">{t('vehicleDetails.description')}</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-2">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.engine')}</h4>
                    <p>{vehicle.engine}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.transmission')}</h4>
                    <p>{vehicle.transmission}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.year')}</h4>
                    <p>{vehicle.year}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.mileage')}</h4>
                    <p>{vehicle.mileage ? vehicle.mileage.toLocaleString() : '0'} {t('vehicleDetails.hours')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.condition')}</h4>
                    <p>{vehicle.condition}</p>
                  </div>
                  {vehicle.horsepower && (
                    <div>
                      <h4 className="font-semibold">{t('vehicleDetails.horsepower')}</h4>
                      <p>{vehicle.horsepower} HP</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="space-y-2">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.category')}</h4>
                    <p>{vehicle.category}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.subcategory')}</h4>
                    <p>{vehicle.subcategory}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.brand')}</h4>
                    <p>{vehicle.brand}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.model')}</h4>
                    <p>{vehicle.model}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{t('vehicleDetails.price')}</h4>
                    <p>${vehicle.price.toLocaleString()}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="features" className="space-y-2">
                {vehicle.features && vehicle.features.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {vehicle.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{t('vehicleDetails.noFeatures')}</p>
                )}
              </TabsContent>
              <TabsContent value="description" className="space-y-2">
                <p>{vehicle.description}</p>
              </TabsContent>
            </Tabs>

            {/* Contact Buttons */}
            <div className="flex justify-around mt-6">
              <Button onClick={handleCallClick} variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                {t('vehicleDetails.callNow')}
              </Button>
              <Button onClick={handleMailClick} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                {t('vehicleDetails.sendEmail')}
              </Button>
              <Button onClick={handleShareClick} variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                {t('vehicleDetails.shareVehicle')}
              </Button>
              <Button onClick={handlePrintClick} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                {t('vehicleDetails.printDetails')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Similar Vehicles */}
        {similarVehicles && similarVehicles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">{t('vehicleDetails.similarVehicles')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {similarVehicles.map(similarVehicle => (
                <Card key={similarVehicle.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative overflow-hidden">
                    <img
                      src={similarVehicle.images && similarVehicle.images.length > 0 ? similarVehicle.images[0] : "https://via.placeholder.com/400x200"}
                      alt={similarVehicle.model}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-blue-600">{similarVehicle.category}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{similarVehicle.brand} {similarVehicle.model}</CardTitle>
                    <CardDescription className="text-xl text-orange-600">${similarVehicle.price.toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-slate-800 hover:bg-slate-700">
                      {t('common.viewDetails')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Additional Information Section */}
        <section className="mt-12 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicleDetails.vehicleLocation')}</CardTitle>
              <CardDescription>Lisbon, Portugal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-500" />
                {t('vehicleDetails.mapPlaceholder')}
              </div>
              <Button variant="link" className="mt-4">{t('vehicleDetails.viewOnGoogleMaps')}</Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-green-50 text-green-900">
              <CardHeader>
                <CardTitle>{t('vehicleDetails.financing')}</CardTitle>
                <CardDescription>{t('vehicleDetails.financingAvailable')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Shield className="h-6 w-6 mb-2" />
                {t('vehicleDetails.financingDetails')}
              </CardContent>
            </Card>

            <Card className="bg-blue-50 text-blue-900">
              <CardHeader>
                <CardTitle>{t('vehicleDetails.warranty')}</CardTitle>
                <CardDescription>{t('vehicleDetails.warrantyIncluded')}</CardDescription>
              </CardHeader>
              <CardContent>
                <FileText className="h-6 w-6 mb-2" />
                {t('vehicleDetails.warrantyDetails')}
              </CardContent>
            </Card>

            <Card className="bg-orange-50 text-orange-900">
              <CardHeader>
                <CardTitle>{t('vehicleDetails.inspection')}</CardTitle>
                <CardDescription>{t('vehicleDetails.inspectionReportAvailable')}</CardDescription>
              </CardHeader>
              <CardContent>
                <History className="h-6 w-6 mb-2" />
                {t('vehicleDetails.inspectionDetails')}
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
