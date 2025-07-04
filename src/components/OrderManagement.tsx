
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Filter } from "lucide-react";

interface Order {
  id: string;
  name: string;
  customer_email: string;
  truck_model: string;
  order_date: string;
  amount: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  phone?: string | null;
  message?: string | null;
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    name: "ABC Logistics Inc.",
    customer_email: "contact@abclogistics.com",
    truck_model: "Volvo FH16 750",
    order_date: "2024-01-15",
    amount: 185000,
    status: "confirmed",
    payment_status: "paid",
    phone: "+351 912 345 678",
    message: "Interested in this vehicle for our fleet expansion."
  },
  {
    id: "ORD-002",
    name: "TransGlobal Solutions",
    customer_email: "orders@transglobal.com",
    truck_model: "Scania R500",
    order_date: "2024-01-14",
    amount: 165000,
    status: "pending",
    payment_status: "pending",
    phone: "+351 913 456 789",
    message: null
  },
  {
    id: "ORD-003",
    name: "Highway Masters LLC",
    customer_email: "fleet@highwaymasters.com",
    truck_model: "Mercedes Actros 2551",
    order_date: "2024-01-12",
    amount: 175000,
    status: "delivered",
    payment_status: "paid",
    phone: null,
    message: "Need urgent delivery for project deadline."
  },
  {
    id: "ORD-004",
    name: "City Freight Co.",
    customer_email: "purchasing@cityfreight.com",
    truck_model: "MAN TGX 540",
    order_date: "2024-01-10",
    amount: 155000,
    status: "cancelled",
    payment_status: "refunded",
    phone: "+351 915 678 901",
    message: "Changed requirements, looking for different specifications."
  },
];

const OrderManagement = () => {
  const [orders] = useState<Order[]>(mockOrders);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors = {
      pending: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
      refunded: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const totalRevenue = orders
    .filter(order => order.payment_status === "paid")
    .reduce((sum, order) => sum + order.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                €{(totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">Pending Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {orders.filter(o => o.status === "delivered").length}
              </p>
              <p className="text-sm text-gray-600">Delivered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Manage customer orders and track deliveries</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle Model</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.name}</p>
                      <p className="text-sm text-gray-500">{order.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.truck_model}</TableCell>
                  <TableCell>{order.order_date}</TableCell>
                  <TableCell>€{order.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.phone && <p>📞 {order.phone}</p>}
                      {order.message && (
                        <p className="text-gray-500 truncate max-w-32" title={order.message}>
                          💬 {order.message}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
