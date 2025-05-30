import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck } from "@/hooks/useTrucks";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useBrands } from "@/hooks/useBrands";

interface EditTruckModalProps {
  truck: Truck | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (truck: Partial<Truck>) => void;
}

const EditTruckModal = ({ truck, isOpen, onClose, onSave }: EditTruckModalProps) => {
  const [formData, setFormData] = useState<Partial<Truck>>({});
  const { data: subcategoryOptions = [] } = useFilterOptions('trucks', 'subcategory');
  const { data: brands = [] } = useBrands('trucks');

  useEffect(() => {
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
        category: truck.category,
        subcategory: truck.subcategory,
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
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.slug}>
                      {brand.name}
                    </SelectItem>
                  ))}
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

          <div className="grid md:grid-cols-4 gap-4">
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
            <div>
              <Label htmlFor="edit-horsepower">Horsepower</Label>
              <Input
                id="edit-horsepower"
                type="number"
                value={formData.horsepower || ''}
                onChange={(e) => setFormData({...formData, horsepower: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-condition">Condition</Label>
              <Select onValueChange={(value) => setFormData({...formData, condition: value})} defaultValue={truck.condition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                  <SelectItem value="refurbished">Refurbished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select onValueChange={(value) => setFormData({...formData, category: value})} defaultValue={truck.category || ''}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trucks">Trucks</SelectItem>
                  <SelectItem value="machinery">Machinery</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-subcategory">Subcategory</Label>
              <Select onValueChange={(value) => setFormData({...formData, subcategory: value})} defaultValue={truck.subcategory || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategoryOptions.map((option) => (
                    <SelectItem key={option.id} value={option.option_value}>
                      {option.option_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-engine">Engine</Label>
              <Select onValueChange={(value) => setFormData({...formData, engine: value})} defaultValue={truck.engine}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label htmlFor="edit-transmission">Transmission</Label>
              <Select onValueChange={(value) => setFormData({...formData, transmission: value})} defaultValue={truck.transmission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="automated-manual">Automated Manual</SelectItem>
                  <SelectItem value="cvt">CVT</SelectItem>
                </SelectContent>
              </Select>
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
