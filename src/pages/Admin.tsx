
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import FeaturedTrucksManager from "@/components/FeaturedTrucksManager";
import OrderManagement from "@/components/OrderManagement";
import VehicleSpecificationsForm from "@/components/VehicleSpecificationsForm";
import ImageCompressionTool from "@/components/ImageCompressionTool";

const Admin = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('admin.title')}</h1>
        
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">{t('admin.analytics')}</TabsTrigger>
            <TabsTrigger value="orders">{t('admin.manageOrders')}</TabsTrigger>
            <TabsTrigger value="featured">{t('admin.featuredTrucks')}</TabsTrigger>
            <TabsTrigger value="add-truck">{t('admin.addTruck')}</TabsTrigger>
            <TabsTrigger value="tools">Ferramentas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <FeaturedTrucksManager />
          </TabsContent>

          <TabsContent value="add-truck" className="space-y-6">
            <VehicleSpecificationsForm />
          </TabsContent>
          
          <TabsContent value="tools" className="space-y-6">
            <div className="grid gap-6">
              <ImageCompressionTool />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
