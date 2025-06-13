
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, Pause, Play, RotateCcw } from "lucide-react";
import { useState } from "react";

// Reset data - all zeros for fresh start
const resetSalesData = [
  { month: "Jan", sales: 0, revenue: 0 },
  { month: "Feb", sales: 0, revenue: 0 },
  { month: "Mar", sales: 0, revenue: 0 },
  { month: "Apr", sales: 0, revenue: 0 },
  { month: "May", sales: 0, revenue: 0 },
  { month: "Jun", sales: 0, revenue: 0 },
];

const resetBrandData = [
  { name: "Volvo", value: 0, color: "#0088FE" },
  { name: "Scania", value: 0, color: "#00C49F" },
  { name: "Mercedes", value: 0, color: "#FFBB28" },
  { name: "MAN", value: 0, color: "#FF8042" },
];

const AnalyticsDashboard = () => {
  const [isPaused, setIsPaused] = useState(true);
  const [isReset, setIsReset] = useState(true);

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsReset(true);
    setIsPaused(true);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Control Panel */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Pause className="h-5 w-5 text-orange-600" />
                ) : (
                  <Play className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium text-gray-700">
                  Analytics Status:
                </span>
                <Badge variant={isPaused ? "secondary" : "default"}>
                  {isPaused ? "Paused" : "Active"}
                </Badge>
              </div>
              {isReset && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Data Reset
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Data
              </Button>
              <Button
                variant={isPaused ? "default" : "secondary"}
                size="sm"
                onClick={handleTogglePause}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Analytics
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Analytics
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {isPaused 
              ? "Analytics tracking is currently paused. Data collection has been suspended."
              : "Analytics are actively tracking vehicle sales and performance metrics."
            }
          </p>
        </CardContent>
      </Card>

      {/* Stats Overview - Reset to zeros */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={isPaused ? "opacity-60" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
                <p className="text-3xl font-bold">0</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-400">No data</span>
                </div>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={isPaused ? "opacity-60" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold">$0</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-400">No data</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={isPaused ? "opacity-60" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-3xl font-bold">$0</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-400">No data</span>
                </div>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={isPaused ? "opacity-60" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-3xl font-bold">0%</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-400">No data</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={isPaused ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sales Trend
              {isPaused && <Badge variant="secondary" className="text-xs">Paused</Badge>}
            </CardTitle>
            <CardDescription>Monthly sales over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={resetSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <Pause className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Analytics Paused</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={isPaused ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Revenue Growth
              {isPaused && <Badge variant="secondary" className="text-xs">Paused</Badge>}
            </CardTitle>
            <CardDescription>Monthly revenue in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resetSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${(value as number / 1000000).toFixed(1)}M`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <Pause className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Analytics Paused</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Distribution */}
      <Card className={isPaused ? "opacity-60" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Brand Distribution
            {isPaused && <Badge variant="secondary" className="text-xs">Paused</Badge>}
          </CardTitle>
          <CardDescription>Sales by truck brand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={resetBrandData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resetBrandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <Pause className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Analytics Paused</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {resetBrandData.map((brand) => (
                <div key={brand.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3" 
                      style={{ backgroundColor: brand.color }}
                    />
                    <span className="font-medium">{brand.name}</span>
                  </div>
                  <span className="text-gray-600">{brand.value} sales</span>
                </div>
              ))}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  {isPaused ? "Data collection paused" : "Real-time data tracking"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
