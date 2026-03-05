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
import { Save, X, Upload, Trash2, ImageIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [specs, setSpecs] = useState<any[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, any>>({});
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);

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

  // Load editing product data
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
      if (editingProduct.images) {
        const sortedImages = [...editingProduct.images].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setImages(sortedImages.map((img: any) => img.image_url));
      }
      // Load featured status
      const loadFeatured = async () => {
        const { data } = await supabase
          .from('featured_products')
          .select('*')
          .eq('product_id', editingProduct.id)
          .maybeSingle();
        if (data) {
          setIsFeatured(true);
          setDisplayOrder(data.display_order ?? 0);
        }
      };
      loadFeatured();
    }
  }, [editingProduct]);

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

  useEffect(() => {
    if (!form.category_id) { setBrands([]); return; }
    const loadBrands = async () => {
      const { data } = await supabase
        .from('category_brands')
        .select('brands(*)')
        .eq('category_id', form.category_id);
      const extracted = data?.map((row: any) => row.brands).filter(Boolean) || [];
      setBrands(extracted);
    };
    loadBrands();
  }, [form.category_id]);

  // Load specs when subcategory changes
  useEffect(() => {
    if (!form.subcategory_id) { setSpecs([]); setSpecValues({}); return; }
    const loadSpecs = async () => {
      const { data } = await supabase.from('spec_definitions').select('*').eq('subcategory_id', form.subcategory_id);
      setSpecs(data || []);
      if (editingProduct) {
        const { data: ev } = await supabase.from('spec_values').select('*').eq('product_id', editingProduct.id);
        if (ev) {
          const m: Record<string, any> = {};
          ev.forEach((sv: any) => { m[sv.spec_definition_id] = sv.value_number ?? sv.value_text ?? sv.value_boolean ?? ''; });
          setSpecValues(m);
        }
      }
    };
    loadSpecs();
  }, [form.subcategory_id, editingProduct]);

  const handleSpecChange = (specId: string, value: any) => {
    setSpecValues((prev) => ({ ...prev, [specId]: value }));
  };

  const getCategorySlug = () => {
    if (!form.category_id) return 'sem-categoria';
    const cat = categories.find((c: any) => c.id === form.category_id);
    return cat?.slug || 'sem-categoria';
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!file) return null;

    setUploading(true);
    const categorySlug = getCategorySlug();
    const ext = file.name.split('.').pop();
    const fileName = `${categorySlug}/${productId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, file);

    if (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Falha ao carregar imagem.', variant: 'destructive' });
      setUploading(false);
      return null;
    }

    const url = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName).data.publicUrl;

    setUploading(false);
    return url;
  };

  const handleAddImage = async () => {
    if (!file) return;

    // If editing, we have the product ID; otherwise use a temp approach
    const tempId = editingProduct?.id || 'temp';
    const url = await uploadImage(tempId);
    if (url) {
      setImages((prev) => [...prev, url]);
      setFile(null);
      const input = document.getElementById('image-upload') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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

    let productId = editingProduct?.id;
    let error;

    if (editingProduct) {
      ({ error } = await supabase.from('products').update(payload).eq('id', productId));
    } else {
      const result = await supabase.from('products').insert([payload]).select('id').single();
      error = result.error;
      productId = result.data?.id;
    }

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Save images to product_images table
    if (productId && images.length > 0) {
      // Delete existing images if editing
      if (editingProduct) {
        await supabase.from('product_images').delete().eq('product_id', productId);
      }

      const imageRows = images.map((url, i) => ({
        product_id: productId,
        image_url: url,
        is_primary: i === 0,
        sort_order: i,
      }));

      const { error: imgError } = await supabase.from('product_images').insert(imageRows);
      if (imgError) {
        console.error('Error saving images:', imgError);
      }
    }

    // Save spec values
    if (productId && Object.keys(specValues).length > 0) {
      if (editingProduct) {
        await supabase.from('spec_values').delete().eq('product_id', productId);
      }
      const specInserts = Object.entries(specValues)
        .filter(([_, val]) => val !== '' && val != null)
        .map(([specDefId, val]) => {
          const spec = specs.find((s) => s.id === specDefId);
          const isNum = spec?.data_type === 'number';
          const isBool = spec?.data_type === 'boolean';
          return {
            product_id: productId,
            spec_definition_id: specDefId,
            value_number: isNum ? parseFloat(val) : null,
            value_text: !isNum && !isBool ? String(val) : null,
            value_boolean: isBool ? Boolean(val) : null,
          };
        });
      if (specInserts.length > 0) {
        await supabase.from('spec_values').insert(specInserts);
      }
    }

    // Save featured status
    if (productId) {
      if (isFeatured) {
        // Remove existing then insert
        await supabase.from('featured_products').delete().eq('product_id', productId);
        await supabase.from('featured_products').insert([{ product_id: productId, display_order: displayOrder }]);
      } else {
        await supabase.from('featured_products').delete().eq('product_id', productId);
      }
    }

    setLoading(false);
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
      setImages([]);
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
            <Input placeholder="Ex: Mercedes Actros 1845" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Modelo</Label>
            <Input placeholder="Ex: Actros 1845" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
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
            <Input type="number" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <Label>Ano</Label>
            <Input type="number" placeholder="2024" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
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
            <Input placeholder="Ex: Lisboa" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} />
          </div>
          <div>
            <Label>País</Label>
            <Input value={form.location_country} onChange={(e) => setForm({ ...form, location_country: e.target.value })} />
          </div>
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea placeholder="Descrição do produto..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
        </div>

        {/* Dynamic Specs */}
        {specs.length > 0 && (
          <div>
            <Label className="text-base font-semibold">Especificações</Label>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              {specs.map((spec) => (
                <div key={spec.id}>
                  <Label>{spec.label} {spec.unit ? `(${spec.unit})` : ''}</Label>
                  {spec.data_type === 'boolean' ? (
                    <Select
                      value={specValues[spec.id]?.toString() || ''}
                      onValueChange={(v) => handleSpecChange(spec.id, v === 'true')}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={spec.data_type === 'number' ? 'number' : 'text'}
                      placeholder={spec.label}
                      value={specValues[spec.id] ?? ''}
                      onChange={(e) => handleSpecChange(spec.id, spec.data_type === 'number' ? e.target.value : e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Product */}
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              id="featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked === true)}
            />
            <Label htmlFor="featured" className="cursor-pointer">Destacar na homepage</Label>
          </div>
          {isFeatured && (
            <div className="flex items-center gap-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                className="w-24"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <Label>Imagens</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleAddImage} disabled={!file || uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'A carregar...' : 'Carregar'}
            </Button>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {images.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-24 object-cover rounded border" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">Principal</span>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(i)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="mt-3 border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma imagem adicionada</p>
            </div>
          )}
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
