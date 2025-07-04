
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateContactOrder } from "@/hooks/useContactOrders";
import { Vehicle } from "@/hooks/useVehicles";

interface ContactVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

const ContactVehicleModal = ({ isOpen, onClose, vehicle }: ContactVehicleModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const createOrder = useCreateContactOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createOrder.mutateAsync({
        name: formData.name,
        customer_email: formData.email,
        vehicle_id: vehicle.id,
        vehicle_title: vehicle.title,
        vehicle_price: vehicle.price_eur,
        message: formData.message
      });
      
      // Reset form and close modal
      setFormData({ name: '', email: '', message: '' });
      onClose();
    } catch (error) {
      console.error('Error submitting contact form:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contactar sobre {vehicle.title}</DialogTitle>
          <DialogDescription>
            Preencha os seus dados para receber mais informações sobre este veículo.
            Preço: €{vehicle.price_eur.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="O seu nome completo"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="o.seu.email@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Questões específicas sobre o veículo..."
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createOrder.isPending || !formData.name || !formData.email}
              className="flex-1"
            >
              {createOrder.isPending ? 'Enviando...' : 'Enviar Contacto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactVehicleModal;
