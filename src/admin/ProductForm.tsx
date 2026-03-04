import { useState, useEffect } from 'react';
import { supabase } from '@/admin/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

interface ProductFormProps {
  editingProduct?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ editingProduct, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category_id: '',
    subcategory_id: '',
    brand_id: '',
    price: '',
    year: '',
    description: '',
    condition: 'used',
    model: '',
    location_city: '',
    location_country: 'Portugal',
    currency: 'EUR',
  });

  useEffect(() => {
    if (editingProduct) {
      setForm({
        title: editingProduct.title || '',
        category_id: editingProduct.category_id || '',
        subcategory_id: editingProduct.subcategory_id || '',
        brand_id: editingProduct.brand_id || '',
        price: editingProduct.price?.toString() || '',
        year: editingProduct.year?.toString() || '',
        description: editingProduct.description || '',
        condition: editingProduct.condition || 'used',
        model: editingProduct.model || '',
        location_city: editingProduct.location_city || '',
        location_country: editingProduct.location_country || 'Portugal',
        currency: editingProduct.currency || 'EUR',
      });
    }
  }, [editingProduct]);

  // Load subcategories when category changes
  useEffect(() => {
    if (form.category_id) {
      supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', form.category_id)
        .eq('is_active', true)
        .order('name')
        .then(({ data }) => setSubcategories(data || []));
    } else {
      setSubcategories([]);
    }
  }, [form.category_id]);

  // Load brands
  useEffect(() => {
    supabase
      .from('brands')
      .select('*')
      .order('name')
      .then(({ data }) => setBrands(data || []));
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const payload = {
      title: form.title,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      brand_id: form.brand_id || null,
      price: form.price ? parseFloat(form.price) : null,
      year: form.year ? parseInt(form.year) : null,
      description: form.description || null,
      condition: form.condition || null,
      model: form.model || null,
      location_city: form.location_city || null,
      location_country: form.location_country || null,
      currency: form.currency,
    };

    let error;
    if (editingProduct) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editingProduct.id));
    } else {
      ({ error } = await supabase.from('products').insert([payload]));
    }

    setLoading(false);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }

    toast({
      title: editingProduct ? 'Produto atualizado' : 'Produto criado',
      description: 'Operação realizada com sucesso.',
    });

    if (!editingProduct) {
      setForm({
        title: '', category_id: '', subcategory_id: '', brand_id: '',
        price: '', year: '', description: '', condition: 'used',
        model: '', location_city: '', location_country: 'Portugal', currency: 'EUR',
      });
    }

    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingProduct ? 'Editar' : 'Novo'} Produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Título *</Label>
            <Input
              placeholder="Ex: Mercedes Actros 1845"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Modelo</Label>
            <Input
              placeholder="Ex: Actros 1845"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Categoria</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v, subcategory_id: '' })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subcategoria</Label>
            <Select value={form.subcategory_id} onValueChange={(v) => setForm({ ...form, subcategory_id: v })} disabled={!form.category_id}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marca</Label>
            <Select value={form.brand_id} onValueChange={(v) => setForm({ ...form, brand_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Preço (€)</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <Label>Ano</Label>
            <Input
              type="number"
              placeholder="2024"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div>
            <Label>Condição</Label>
            <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="used">Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Cidade</Label>
            <Input
              placeholder="Ex: Lisboa"
              value={form.location_city}
              onChange={(e) => setForm({ ...form, location_city: e.target.value })}
            />
          </div>
          <div>
            <Label>País</Label>
            <Input
              value={form.location_country}
              onChange={(e) => setForm({ ...form, location_country: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            placeholder="Descrição do produto..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'A guardar...' : 'Guardar'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
