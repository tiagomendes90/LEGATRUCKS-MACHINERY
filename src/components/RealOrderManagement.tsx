
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Filter, Plus, Edit, Trash2 } from "lucide-react";
import { useOrders, useUpdateOrder, useDeleteOrder, Order } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

const RealOrderManagement = () => {
  const { data: orders = [], isLoading } = useOrders();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };

    const statusLabels = {
      pending: "Pendente",
      confirmed: "Confirmado",
      delivered: "Entregue",
      cancelled: "Cancelado"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors = {
      pending: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
      refunded: "bg-gray-100 text-gray-800"
    };

    const paymentLabels = {
      pending: "Pendente",
      paid: "Pago",
      refunded: "Reembolsado"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {paymentLabels[status as keyof typeof paymentLabels] || status}
      </Badge>
    );
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ 
      id: orderId, 
      updates: { status: newStatus as Order['status'] } 
    });
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    updateOrderMutation.mutate({ 
      id: orderId, 
      updates: { payment_status: newPaymentStatus as Order['payment_status'] } 
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Tem a certeza de que deseja eliminar este pedido?')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const totalRevenue = orders
    .filter(order => order.payment_status === "paid")
    .reduce((sum, order) => sum + order.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">A carregar pedidos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-gray-600">Total de Pedidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                €{(totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600">Receita Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">Pedidos Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {orders.filter(o => o.status === "delivered").length}
              </p>
              <p className="text-sm text-gray-600">Entregues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Pedidos</CardTitle>
              <CardDescription>Gerir pedidos de clientes e acompanhar entregas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pedidos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="delivered">Entregues</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Modelo do Veículo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.name}</p>
                      <p className="text-sm text-gray-500">{order.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.truck_model}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString('pt-PT')}</TableCell>
                  <TableCell>€{order.amount.toLocaleString('pt-PT')}</TableCell>
                  <TableCell>
                    <Select 
                      value={order.status} 
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={order.payment_status} 
                      onValueChange={(value) => handlePaymentStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="refunded">Reembolsado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" title="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteOrderMutation.isPending}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum pedido encontrado com os critérios selecionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealOrderManagement;
