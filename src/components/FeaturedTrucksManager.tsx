
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Star } from "lucide-react";
import { useFeaturedTrucks, useAddFeaturedTruck, useRemoveFeaturedTruck } from "@/hooks/useFeaturedTrucks";
import { useTrucks } from "@/hooks/useTrucks";

const FeaturedTrucksManager = () => {
  const { data: featuredTrucks = [], isLoading: featuredLoading } = useFeaturedTrucks();
  const { data: allTrucks = [], isLoading: trucksLoading } = useTrucks();
  const addFeaturedMutation = useAddFeaturedTruck();
  const removeFeaturedMutation = useRemoveFeaturedTruck();

  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");

  // Get available trucks (not already featured)
  const featuredTruckIds = featuredTrucks.map(ft => ft.truck_id);
  const availableTrucks = allTrucks.filter(truck => !featuredTruckIds.includes(truck.id));

  // Get available positions (1-3, not already taken)
  const usedPositions = featuredTrucks.map(ft => ft.position);
  const availablePositions = [1, 2, 3].filter(pos => !usedPositions.includes(pos));

  const handleAddFeatured = () => {
    if (selectedTruckId && selectedPosition) {
      addFeaturedMutation.mutate({
        truck_id: selectedTruckId,
        position: parseInt(selectedPosition)
      }, {
        onSuccess: () => {
          setSelectedTruckId("");
          setSelectedPosition("");
        }
      });
    }
  };

  const handleRemoveFeatured = (featuredTruckId: string) => {
    removeFeaturedMutation.mutate(featuredTruckId);
  };

  if (featuredLoading || trucksLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Featured Trucks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Featured Trucks Management
        </CardTitle>
        <CardDescription>
          Manage the 3 featured trucks displayed on the homepage. Only 3 trucks can be featured at a time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Featured Truck */}
        {availablePositions.length > 0 && availableTrucks.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-4">Add Featured Truck</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Truck</label>
                <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTrucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.brand} {truck.model} ({truck.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose position" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePositions.map((position) => (
                      <SelectItem key={position} value={position.toString()}>
                        Position {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddFeatured}
                  disabled={!selectedTruckId || !selectedPosition || addFeaturedMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addFeaturedMutation.isPending ? "Adding..." : "Add Featured"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Current Featured Trucks */}
        <div>
          <h3 className="font-semibold mb-4">Current Featured Trucks ({featuredTrucks.length}/3)</h3>
          {featuredTrucks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No featured trucks set. Add some trucks to feature on the homepage.
            </div>
          ) : (
            <div className="space-y-4">
              {featuredTrucks
                .sort((a, b) => a.position - b.position)
                .map((featured) => (
                  <div key={featured.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">Position {featured.position}</Badge>
                      <div>
                        <h4 className="font-semibold">
                          {featured.trucks.brand} {featured.trucks.model}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {featured.trucks.year} • ${featured.trucks.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFeatured(featured.id)}
                      disabled={removeFeaturedMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Featured trucks appear on the homepage in the order of their positions. 
            If no featured trucks are set, the homepage will show the first 3 trucks from your inventory.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedTrucksManager;
