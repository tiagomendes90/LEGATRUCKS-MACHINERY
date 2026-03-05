import { useState, useEffect } from 'react';
import { supabase } from '@/admin/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Edit, Trash2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ProductForm from '@/admin/ProductForm';

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadFeatured = async () => {
    const { data } = await supabase.from('featured_products').select('product_id');
    setFeaturedIds(new Set((data || []).map((r: any) => r.product_id)));
  };

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, brand:brands(name), images:product_images(image_url, is_primary, sort_order)')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
    loadFeatured();
  }, []);

  const toggleFeatured = async (productId: string) => {
    if (featuredIds.has(productId)) {
      const { error } = await supabase.from('featured_products').delete().eq('product_id', productId);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return;
      }
      setFeaturedIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      toast({ title: 'Destaque removido' });
    } else {
      const nextOrder = featuredIds.size + 1;
      const { error } = await supabase.from('featured_products').insert([{ product_id: productId, display_order: nextOrder }]);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return;
      }
      setFeaturedIds(prev => new Set(prev).add(productId));
      toast({ title: 'Produto destacado' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este produto?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Produto eliminado' });
      loadProducts();
    }
  };

  const handleEdit = (product: any) => {
    setEditing(product);
    setIsEditOpen(true);
  };

  const getPrimaryImage = (product: any) => {
    const primary = product.images?.find((img: any) => img.is_primary);
    return primary?.image_url || product.images?.[0]?.image_url;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar produtos...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>{products.length} produtos no inventário</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getPrimaryImage(p) && (
                        <img src={getPrimaryImage(p)} alt={p.title} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium">{p.title}</p>
                        {p.model && <p className="text-sm text-muted-foreground">{p.model}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{p.brand?.name || '—'}</TableCell>
                  <TableCell>{p.year || '—'}</TableCell>
                  <TableCell>{p.price ? `€${Number(p.price).toLocaleString()}` : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured(p.id)}
                      title={featuredIds.has(p.id) ? 'Remover destaque' : 'Destacar na homepage'}
                    >
                      <Star
                        className={`h-5 w-5 ${featuredIds.has(p.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/vehicle/${p.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProductForm
              editingProduct={editing}
              onSuccess={() => { setIsEditOpen(false); setEditing(null); loadProducts(); loadFeatured(); }}
              onCancel={() => { setIsEditOpen(false); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}