
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Filter } from "lucide-react";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  truckModel: string;
  orderDate: string;
  amount: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "ABC Logistics Inc.",
    customerEmail: "contact@abclogistics.com",
    truckModel: "Volvo FH16 750",
    orderDate: "2024-01-15",
    amount: 185000,
    status: "confirmed",
    paymentStatus: "paid"
  },
  {
    id: "ORD-002",
    customerName: "TransGlobal Solutions",
    customerEmail: "orders@transglobal.com",
    truckModel: "Scania R500",
    orderDate: "2024-01-14",
    amount: 165000,
    status: "pending",
    paymentStatus: "pending"
  },
  {
    id: "ORD-003",
    customerName: "Highway Masters LLC",
    customerEmail: "fleet@highwaymasters.com",
    truckModel: "Mercedes Actros 2551",
    orderDate: "2024-01-12",
    amount: 175000,
    status: "delivered",
    paymentStatus: "paid"
  },
  {
    id: "ORD-004",
    customerName: "City Freight Co.",
    customerEmail: "purchasing@cityfreight.com",
    truckModel: "MAN TGX 540",
    orderDate: "2024-01-10",
    amount: 155000,
    status: "cancelled",
    paymentStatus: "refunded"
  },
];

const OrderManagement = () => {
  const [orders] = useState<Order[]>(mockOrders);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      confirmed: "secondary",
      delivered: "default",
      cancelled: "destructive"
    };
    
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
    .filter(order => order.paymentStatus === "paid")
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
                ${(totalRevenue / 1000000).toFixed(1)}M
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
                <TableHead>Truck Model</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.truckModel}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>${order.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
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
