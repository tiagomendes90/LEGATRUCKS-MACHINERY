
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateContactMessage } from "@/hooks/useContactMessages";
import { Vehicle } from "@/hooks/useVehicles";
import { useTranslation } from "react-i18next";

interface ContactVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

const ContactVehicleModal = ({ isOpen, onClose, vehicle }: ContactVehicleModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const createMessage = useCreateContactMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMessage.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message,
        source: 'vehicle',
        vehicle_id: vehicle.id,
        vehicle_title: vehicle.title,
        vehicle_url: typeof window !== 'undefined'
          ? `${window.location.origin}/vehicle/${vehicle.id}`
          : `/vehicle/${vehicle.id}`,
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
      onClose();
    } catch (error) {
      console.error('Error submitting contact form:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('contactModal.title', { vehicle: vehicle.title })}</DialogTitle>
          <DialogDescription>
            {t('contactModal.description')}
            {' '}{t('contactModal.priceLabel', { price: (vehicle.price || 0).toLocaleString() })}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">{t('contactModal.name')}</Label>
              <Input id="name" type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required placeholder={t('contactModal.namePlaceholder')} />
            </div>
            <div>
              <Label htmlFor="email">{t('contactModal.email')}</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required placeholder={t('contactModal.emailPlaceholder')} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+351 ..." />
            </div>
            <div>
              <Label htmlFor="message">{t('contactModal.message')}</Label>
              <Textarea id="message" value={formData.message} onChange={(e) => handleInputChange('message', e.target.value)} placeholder={t('contactModal.messagePlaceholder')} rows={4} />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t('contactModal.cancel')}</Button>
            <Button type="submit" disabled={createMessage.isPending || !formData.name || !formData.email} className="flex-1">
              {createMessage.isPending ? t('contactModal.sending') : t('contactModal.send')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactVehicleModal;
