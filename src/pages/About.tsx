import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Wrench, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const About = () => {
  const stats = [{
    number: "20+",
    label: "Years Experience"
  }, {
    number: "5000+",
    label: "Trucks Sold"
  }, {
    number: "50+",
    label: "Expert Team"
  }, {
    number: "24/7",
    label: "Support Available"
  }];
  const values = [{
    icon: <Award className="h-8 w-8 text-blue-600" />,
    title: "Quality Excellence",
    description: "We source only the highest quality trucks from trusted manufacturers, ensuring every vehicle meets our rigorous standards."
  }, {
    icon: <Users className="h-8 w-8 text-green-600" />,
    title: "Customer First",
    description: "Our customers are at the heart of everything we do. We build lasting relationships through exceptional service and support."
  }, {
    icon: <Wrench className="h-8 w-8 text-orange-600" />,
    title: "Expert Service",
    description: "Our certified technicians provide comprehensive maintenance and repair services to keep your fleet running smoothly."
  }, {
    icon: <Globe className="h-8 w-8 text-purple-600" />,
    title: "Industry Leadership",
    description: "We stay ahead of industry trends and innovations to provide our customers with the most advanced trucking solutions."
  }];
  return <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-[130px]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">About LEGA</h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
              For over two decades, we've been the trusted partner for businesses seeking premium commercial trucks. 
              Our commitment to quality, service, and innovation has made us a leader in the industry.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-lg text-gray-600">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6">Our Story</h2>
              <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                <p>
                  Founded in 2003 by industry veterans Mike Johnson and Sarah Chen, TruckHub began as a small 
                  dealership with a simple mission: provide businesses with reliable, high-quality commercial trucks 
                  backed by exceptional service.
                </p>
                <p>
                  What started as a modest operation has grown into a nationwide network, but our core values remain 
                  unchanged. We believe that every business deserves access to premium trucks that can handle their 
                  toughest challenges while delivering outstanding performance and value.
                </p>
                <p>
                  Today, we're proud to serve thousands of customers across the country, from small local businesses 
                  to large fleet operators, helping them find the perfect trucks to power their success.
                </p>
              </div>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=600&h=400&fit=crop" alt="Our facility" className="rounded-lg shadow-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-800">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-slate-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Work With Us?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Experience the TruckHub difference. Let our expert team help you find the perfect truck for your business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 px-8 py-6 text-lg">
              Browse Our Inventory
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:text-blue-900 px-8 py-6 text-lg bg-neutral-100">
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default About;