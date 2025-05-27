import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Package, DollarSign, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Admin = () => {
  const [trucks, setTrucks] = useState([
    { id: 1, name: "Heavy Duty Titan", category: "heavy-duty", price: 125000, status: "available" },
    { id: 2, name: "Medium Pro", category: "medium-duty", price: 75000, status: "sold" },
    { id: 3, name: "Light Express", category: "light-duty", price: 45000, status: "available" }
  ]);

  const [newTruck, setNewTruck] = useState({
    name: "",
    brand: "",
    category: "",
    price: "",
    year: "",
    mileage: "",
    condition: "",
    engineType: "",
    transmission: "",
    fuelType: "",
    description: "",
    specs: ""
  });

  const { toast } = useToast();

  const handleAddTruck = (e: React.FormEvent) => {
    e.preventDefault();
    const truck = {
      id: trucks.length + 1,
      name: newTruck.name,
      category: newTruck.category,
      price: parseInt(newTruck.price),
      status: "available"
    };
    setTrucks([...trucks, truck]);
    setNewTruck({ 
      name: "", 
      brand: "",
      category: "", 
      price: "", 
      year: "",
      mileage: "",
      condition: "",
      engineType: "",
      transmission: "",
      fuelType: "",
      description: "", 
      specs: "" 
    });
    toast({
      title: "Truck Added",
      description: "New truck has been added to the inventory successfully.",
    });
  };

  const handleDeleteTruck = (id: number) => {
    setTrucks(trucks.filter(truck => truck.id !== id));
    toast({
      title: "Truck Deleted",
      description: "Truck has been removed from the inventory.",
    });
  };

  const stats = [
    { title: "Total Inventory", value: "45", icon: <Package className="h-8 w-8" />, color: "bg-blue-500" },
    { title: "Monthly Sales", value: "$2.4M", icon: <DollarSign className="h-8 w-8" />, color: "bg-green-500" },
    { title: "Active Customers", value: "1,234", icon: <Users className="h-8 w-8" />, color: "bg-purple-500" },
    { title: "Growth Rate", value: "+15%", icon: <BarChart3 className="h-8 w-8" />, color: "bg-orange-500" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your truck inventory and business operations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="add-truck">Add Truck</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Truck Inventory</CardTitle>
                <CardDescription>Manage your truck inventory and update availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trucks.map((truck) => (
                    <div key={truck.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{truck.name}</h3>
                        <p className="text-gray-600 capitalize">{truck.category.replace('-', ' ')}</p>
                        <p className="font-medium text-green-600">${truck.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={truck.status === 'available' ? 'default' : 'secondary'}>
                          {truck.status}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteTruck(truck.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-truck">
            <Card>
              <CardHeader>
                <CardTitle>Add New Truck</CardTitle>
                <CardDescription>Add a new truck to your inventory with detailed specifications</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTruck} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="truck-name">Truck Name/Model</Label>
                      <Input
                        id="truck-name"
                        value={newTruck.name}
                        onChange={(e) => setNewTruck({...newTruck, name: e.target.value})}
                        placeholder="Heavy Duty Hauler"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Select onValueChange={(value) => setNewTruck({...newTruck, brand: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volvo">Volvo</SelectItem>
                          <SelectItem value="scania">Scania</SelectItem>
                          <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
                          <SelectItem value="man">MAN</SelectItem>
                          <SelectItem value="daf">DAF</SelectItem>
                          <SelectItem value="iveco">Iveco</SelectItem>
                          <SelectItem value="kenworth">Kenworth</SelectItem>
                          <SelectItem value="peterbilt">Peterbilt</SelectItem>
                          <SelectItem value="freightliner">Freightliner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={(value) => setNewTruck({...newTruck, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heavy-duty">Heavy Duty</SelectItem>
                          <SelectItem value="medium-duty">Medium Duty</SelectItem>
                          <SelectItem value="light-duty">Light Duty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="condition">Condition</Label>
                      <Select onValueChange={(value) => setNewTruck({...newTruck, condition: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                          <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                          <SelectItem value="refurbished">Refurbished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price and Year */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newTruck.price}
                        onChange={(e) => setNewTruck({...newTruck, price: e.target.value})}
                        placeholder="125000"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={newTruck.year}
                        onChange={(e) => setNewTruck({...newTruck, year: e.target.value})}
                        placeholder="2024"
                        min="2000"
                        max="2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mileage">Mileage (miles)</Label>
                      <Input
                        id="mileage"
                        type="number"
                        value={newTruck.mileage}
                        onChange={(e) => setNewTruck({...newTruck, mileage: e.target.value})}
                        placeholder="50000"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Engine and Transmission */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="engine-type">Engine Type</Label>
                      <Select onValueChange={(value) => setNewTruck({...newTruck, engineType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select engine type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cummins-x15">Cummins X15</SelectItem>
                          <SelectItem value="detroit-dd15">Detroit DD15</SelectItem>
                          <SelectItem value="caterpillar-c15">Caterpillar C15</SelectItem>
                          <SelectItem value="paccar-px-9">Paccar PX-9</SelectItem>
                          <SelectItem value="volvo-d13">Volvo D13</SelectItem>
                          <SelectItem value="mack-mp8">Mack MP8</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="transmission">Transmission</Label>
                      <Select onValueChange={(value) => setNewTruck({...newTruck, transmission: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatic">Automatic</SelectItem>
                          <SelectItem value="automated-manual">Automated Manual</SelectItem>
                          <SelectItem value="cvt">CVT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fuel-type">Fuel Type</Label>
                      <Select onValueChange={(value) => setNewTruck({...newTruck, fuelType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="gasoline">Gasoline</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="natural-gas">Natural Gas</SelectItem>
                          <SelectItem value="biodiesel">Biodiesel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description and Specifications */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTruck.description}
                      onChange={(e) => setNewTruck({...newTruck, description: e.target.value})}
                      placeholder="Detailed description of the truck, features, and selling points..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="specs">Technical Specifications</Label>
                    <Textarea
                      id="specs"
                      value={newTruck.specs}
                      onChange={(e) => setNewTruck({...newTruck, specs: e.target.value})}
                      placeholder="Engine capacity, horsepower, torque, payload capacity, dimensions, etc."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Truck to Inventory
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Track and manage customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">Order #1001</h3>
                      <Badge>Pending</Badge>
                    </div>
                    <p className="text-gray-600">Heavy Duty Titan - ABC Logistics</p>
                    <p className="text-sm text-gray-500">Order Date: Nov 20, 2024</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">Order #1002</h3>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                    <p className="text-gray-600">Medium Pro - XYZ Transport</p>
                    <p className="text-sm text-gray-500">Order Date: Nov 18, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Business Analytics</CardTitle>
                <CardDescription>Track your business performance and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Sales Trends</h3>
                    <p className="text-3xl font-bold text-blue-600">+15%</p>
                    <p className="text-sm text-gray-600">vs last month</p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Revenue</h3>
                    <p className="text-3xl font-bold text-green-600">$2.4M</p>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Top Category</h3>
                    <p className="text-3xl font-bold text-purple-600">Heavy Duty</p>
                    <p className="text-sm text-gray-600">45% of sales</p>
                  </div>
                  <div className="p-6 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Customer Satisfaction</h3>
                    <p className="text-3xl font-bold text-orange-600">4.8/5</p>
                    <p className="text-sm text-gray-600">Average rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
