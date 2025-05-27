import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Users, Shield, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const Index = () => {
  const featuredTrucks = [{
    id: 1,
    name: "Heavy Duty Titan",
    type: "Heavy Duty",
    price: "$125,000",
    image: "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=500&h=300&fit=crop",
    features: ["40-ton capacity", "Diesel engine", "All-terrain"]
  }, {
    id: 2,
    name: "Medium Duty Pro",
    type: "Medium Duty",
    price: "$75,000",
    image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=500&h=300&fit=crop",
    features: ["25-ton capacity", "Fuel efficient", "City optimized"]
  }, {
    id: 3,
    name: "Light Duty Express",
    type: "Light Duty",
    price: "$45,000",
    image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=500&h=300&fit=crop",
    features: ["10-ton capacity", "Urban delivery", "Compact design"]
  }];
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
              <p className="text-gray-600">Built to last with superior materials and craftsmanship</p>
            </div>
            <div className="text-center group">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Reliable Service</h3>
              <p className="text-gray-600">24/7 support and comprehensive warranty coverage</p>
            </div>
            <div className="text-center group">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Expert Team</h3>
              <p className="text-gray-600">Experienced professionals to guide your purchase</p>
            </div>
            <div className="text-center group">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Industry Leader</h3>
              <p className="text-gray-600">Trusted by businesses nationwide for over 20 years</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trucks */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">Featured Trucks</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredTrucks.map(truck => <Card key={truck.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative overflow-hidden">
                  <img src={truck.image} alt={truck.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <Badge className="absolute top-4 left-4 bg-blue-600">{truck.type}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{truck.name}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-orange-600">{truck.price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {truck.features.map((feature, index) => <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>)}
                  </ul>
                  <Button className="w-full bg-slate-800 hover:bg-slate-700">View Details</Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;