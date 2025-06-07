
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleSpecifications } from "@/hooks/useVehicleSpecifications";

interface VehicleSpecificationsFormProps {
  specifications: Partial<VehicleSpecifications>;
  onSpecificationsChange: (specs: Partial<VehicleSpecifications>) => void;
}

const VehicleSpecificationsForm = ({ 
  specifications, 
  onSpecificationsChange 
}: VehicleSpecificationsFormProps) => {
  
  const updateSpec = (key: keyof VehicleSpecifications, value: any) => {
    onSpecificationsChange({
      ...specifications,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Engine & Performance Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Engine & Performance</CardTitle>
          <CardDescription>Core engine and performance specifications</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fuel_type">Fuel Type</Label>
            <Select onValueChange={(value) => updateSpec('fuel_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="gasoline">Gasoline</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="cng">CNG</SelectItem>
                <SelectItem value="lng">LNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="euro_standard">Euro Standard</Label>
            <Select onValueChange={(value) => updateSpec('euro_standard', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Euro standard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="euro-3">Euro 3</SelectItem>
                <SelectItem value="euro-4">Euro 4</SelectItem>
                <SelectItem value="euro-5">Euro 5</SelectItem>
                <SelectItem value="euro-6">Euro 6</SelectItem>
                <SelectItem value="euro-6d">Euro 6d</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fuel_consumption">Fuel Consumption (L/100km)</Label>
            <Input
              id="fuel_consumption"
              type="number"
              step="0.1"
              value={specifications.fuel_consumption || ''}
              onChange={(e) => updateSpec('fuel_consumption', parseFloat(e.target.value) || null)}
              placeholder="25.5"
            />
          </div>

          <div>
            <Label htmlFor="noise_level">Noise Level (dB)</Label>
            <Input
              id="noise_level"
              type="number"
              value={specifications.noise_level || ''}
              onChange={(e) => updateSpec('noise_level', parseFloat(e.target.value) || null)}
              placeholder="72"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drivetrain & Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Drivetrain & Configuration</CardTitle>
          <CardDescription>Vehicle configuration and drivetrain specifications</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="drive_type">Drive Type</Label>
            <Select onValueChange={(value) => updateSpec('drive_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select drive type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4x2">4x2</SelectItem>
                <SelectItem value="4x4">4x4</SelectItem>
                <SelectItem value="6x2">6x2</SelectItem>
                <SelectItem value="6x4">6x4</SelectItem>
                <SelectItem value="6x6">6x6</SelectItem>
                <SelectItem value="8x4">8x4</SelectItem>
                <SelectItem value="8x6">8x6</SelectItem>
                <SelectItem value="8x8">8x8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="axle_configuration">Axle Configuration</Label>
            <Select onValueChange={(value) => updateSpec('axle_configuration', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select axle configuration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Axle</SelectItem>
                <SelectItem value="tandem">Tandem Axle</SelectItem>
                <SelectItem value="tridem">Tridem Axle</SelectItem>
                <SelectItem value="quad">Quad Axle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cabin_type">Cabin Type</Label>
            <Select onValueChange={(value) => updateSpec('cabin_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select cabin type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day-cab">Day Cab</SelectItem>
                <SelectItem value="sleeper">Sleeper</SelectItem>
                <SelectItem value="crew-cab">Crew Cab</SelectItem>
                <SelectItem value="extended-cab">Extended Cab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="suspension_type">Suspension Type</Label>
            <Select onValueChange={(value) => updateSpec('suspension_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select suspension type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leaf-spring">Leaf Spring</SelectItem>
                <SelectItem value="air-suspension">Air Suspension</SelectItem>
                <SelectItem value="coil-spring">Coil Spring</SelectItem>
                <SelectItem value="parabolic">Parabolic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Safety & Assistance Systems */}
      <Card>
        <CardHeader>
          <CardTitle>Safety & Assistance Systems</CardTitle>
          <CardDescription>Advanced safety and driver assistance features</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="abs_brakes">ABS Brakes</Label>
            <Switch
              id="abs_brakes"
              checked={specifications.abs_brakes || false}
              onCheckedChange={(checked) => updateSpec('abs_brakes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ebs_brakes">EBS Brakes</Label>
            <Switch
              id="ebs_brakes"
              checked={specifications.ebs_brakes || false}
              onCheckedChange={(checked) => updateSpec('ebs_brakes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="esp_system">ESP System</Label>
            <Switch
              id="esp_system"
              checked={specifications.esp_system || false}
              onCheckedChange={(checked) => updateSpec('esp_system', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="retarder">Retarder</Label>
            <Switch
              id="retarder"
              checked={specifications.retarder || false}
              onCheckedChange={(checked) => updateSpec('retarder', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lane_departure_warning">Lane Departure Warning</Label>
            <Switch
              id="lane_departure_warning"
              checked={specifications.lane_departure_warning || false}
              onCheckedChange={(checked) => updateSpec('lane_departure_warning', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="adaptive_cruise_control">Adaptive Cruise Control</Label>
            <Switch
              id="adaptive_cruise_control"
              checked={specifications.adaptive_cruise_control || false}
              onCheckedChange={(checked) => updateSpec('adaptive_cruise_control', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="collision_avoidance">Collision Avoidance</Label>
            <Switch
              id="collision_avoidance"
              checked={specifications.collision_avoidance || false}
              onCheckedChange={(checked) => updateSpec('collision_avoidance', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="blind_spot_monitoring">Blind Spot Monitoring</Label>
            <Switch
              id="blind_spot_monitoring"
              checked={specifications.blind_spot_monitoring || false}
              onCheckedChange={(checked) => updateSpec('blind_spot_monitoring', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comfort & Convenience */}
      <Card>
        <CardHeader>
          <CardTitle>Comfort & Convenience</CardTitle>
          <CardDescription>Comfort and convenience features</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="air_conditioning">Air Conditioning</Label>
            <Switch
              id="air_conditioning"
              checked={specifications.air_conditioning || false}
              onCheckedChange={(checked) => updateSpec('air_conditioning', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cruise_control">Cruise Control</Label>
            <Switch
              id="cruise_control"
              checked={specifications.cruise_control || false}
              onCheckedChange={(checked) => updateSpec('cruise_control', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Equipment */}
      <Card>
        <CardHeader>
          <CardTitle>Working Equipment</CardTitle>
          <CardDescription>Specialized equipment and working specifications</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pto_available">PTO Available</Label>
            <Switch
              id="pto_available"
              checked={specifications.pto_available || false}
              onCheckedChange={(checked) => updateSpec('pto_available', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="winch_available">Winch Available</Label>
            <Switch
              id="winch_available"
              checked={specifications.winch_available || false}
              onCheckedChange={(checked) => updateSpec('winch_available', checked)}
            />
          </div>

          <div>
            <Label htmlFor="hydraulic_system">Hydraulic System</Label>
            <Input
              id="hydraulic_system"
              value={specifications.hydraulic_system || ''}
              onChange={(e) => updateSpec('hydraulic_system', e.target.value)}
              placeholder="Type of hydraulic system"
            />
          </div>

          <div>
            <Label htmlFor="crane_capacity">Crane Capacity</Label>
            <Input
              id="crane_capacity"
              value={specifications.crane_capacity || ''}
              onChange={(e) => updateSpec('crane_capacity', e.target.value)}
              placeholder="e.g., 25 tons"
            />
          </div>

          <div>
            <Label htmlFor="loading_capacity">Loading Capacity (kg)</Label>
            <Input
              id="loading_capacity"
              type="number"
              value={specifications.loading_capacity || ''}
              onChange={(e) => updateSpec('loading_capacity', parseFloat(e.target.value) || null)}
              placeholder="10000"
            />
          </div>

          <div>
            <Label htmlFor="max_reach">Max Reach (m)</Label>
            <Input
              id="max_reach"
              type="number"
              step="0.1"
              value={specifications.max_reach || ''}
              onChange={(e) => updateSpec('max_reach', parseFloat(e.target.value) || null)}
              placeholder="15.5"
            />
          </div>

          <div>
            <Label htmlFor="operating_weight">Operating Weight (kg)</Label>
            <Input
              id="operating_weight"
              type="number"
              value={specifications.operating_weight || ''}
              onChange={(e) => updateSpec('operating_weight', parseFloat(e.target.value) || null)}
              placeholder="18000"
            />
          </div>

          <div>
            <Label htmlFor="bucket_capacity">Bucket Capacity (m³)</Label>
            <Input
              id="bucket_capacity"
              type="number"
              step="0.1"
              value={specifications.bucket_capacity || ''}
              onChange={(e) => updateSpec('bucket_capacity', parseFloat(e.target.value) || null)}
              placeholder="2.5"
            />
          </div>

          <div>
            <Label htmlFor="lifting_capacity">Lifting Capacity (kg)</Label>
            <Input
              id="lifting_capacity"
              type="number"
              value={specifications.lifting_capacity || ''}
              onChange={(e) => updateSpec('lifting_capacity', parseFloat(e.target.value) || null)}
              placeholder="5000"
            />
          </div>

          <div>
            <Label htmlFor="working_pressure">Working Pressure (bar)</Label>
            <Input
              id="working_pressure"
              type="number"
              value={specifications.working_pressure || ''}
              onChange={(e) => updateSpec('working_pressure', parseFloat(e.target.value) || null)}
              placeholder="350"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleSpecificationsForm;
