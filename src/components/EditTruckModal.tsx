
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck } from "@/hooks/useTrucks";

interface EditTruckModalProps {
  truck: Truck | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (truck: Partial<Truck>) => void;
}

const EditTruckModal = ({ truck, isOpen, onClose, onSave }: EditTruckModalProps) => {
  const [formData, setFormData] = useState<Partial<Truck>>({});

  useState(() => {
    if (truck) {
      setFormData({
        brand: truck.brand,
        model: truck.model,
        year: truck.year,
        mileage: truck.mileage,
        price: truck.price,
        condition: truck.condition,
        engine: truck.engine,
        transmission: truck.transmission,
        description: truck.description,
        horsepower: truck.horsepower,
      });
    }
  }, [truck]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!truck) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Truck</DialogTitle>
          <DialogDescription>
            Update the truck details below
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Select onValueChange={(value) => setFormData({...formData, brand: value})} defaultValue={truck.brand}>
                <SelectTrigger>
                  <SelectValue />
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
            <div>
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={formData.model || ''}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-mileage">Mileage</Label>
              <Input
                id="edit-mileage"
                type="number"
                value={formData.mileage || ''}
                onChange={(e) => setFormData({...formData, mileage: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTruckModal;
