
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Wrench, Tractor, Info } from 'lucide-react';
import { getCategoryFieldMappings } from '@/utils/migrationHelpers';

const CategoryFieldMapper = () => {
  const mappings = getCategoryFieldMappings();

  const categoryIcons = {
    trucks: Truck,
    machinery: Wrench,
    agriculture: Tractor
  };

  const categoryNames = {
    trucks: 'Trucks',
    machinery: 'Machinery',
    agriculture: 'Agriculture'
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This mapping shows how different vehicle categories should use specific fields to ensure data consistency.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(mappings).map(([category, config]) => {
          const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  {categoryNames[category as keyof typeof categoryNames]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Metric */}
                <div>
                  <h4 className="font-medium mb-2">Primary Metric:</h4>
                  <Badge variant="default">
                    {config.primaryMetric === 'mileage_km' ? 'Mileage (km)' : 'Operating Hours (h)'}
                  </Badge>
                </div>

                {/* Required Fields */}
                <div>
                  <h4 className="font-medium mb-2">Required Fields:</h4>
                  <div className="flex flex-wrap gap-1">
                    {config.requiredFields.map(field => (
                      <Badge key={field} variant="destructive" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h4 className="font-medium mb-2">Optional Fields:</h4>
                  <div className="flex flex-wrap gap-1">
                    {config.optionalFields.map(field => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Field Mapping Rules */}
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Rules:</strong></p>
                  {category === 'trucks' && (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Use mileage_km for distance tracking</li>
                      <li>Fuel type is required</li>
                      <li>Drivetrain specification needed</li>
                    </ul>
                  )}
                  {(category === 'machinery' || category === 'agriculture') && (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Use operating_hours for usage tracking</li>
                      <li>Power (PS) is required</li>
                      <li>Weight specification recommended</li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Field Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle>Field Mapping Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Old Field</th>
                  <th className="text-left p-2">New Field</th>
                  <th className="text-left p-2">Data Type</th>
                  <th className="text-left p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">brand (string)</td>
                  <td className="p-2">brand_id (uuid)</td>
                  <td className="p-2">UUID</td>
                  <td className="p-2">Reference to vehicle_brands table</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">category (string)</td>
                  <td className="p-2">subcategory_id (uuid)</td>
                  <td className="p-2">UUID</td>
                  <td className="p-2">Reference to subcategories table</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">price (number)</td>
                  <td className="p-2">price_eur (numeric)</td>
                  <td className="p-2">Numeric</td>
                  <td className="p-2">Always in EUR</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">year (number)</td>
                  <td className="p-2">registration_year (integer)</td>
                  <td className="p-2">Integer</td>
                  <td className="p-2">Year of registration</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">mileage (number)</td>
                  <td className="p-2">mileage_km (integer)</td>
                  <td className="p-2">Integer</td>
                  <td className="p-2">For trucks only</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">hours (number)</td>
                  <td className="p-2">operating_hours (integer)</td>
                  <td className="p-2">Integer</td>
                  <td className="p-2">For machinery/agriculture</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">horsepower (number)</td>
                  <td className="p-2">power_ps (integer)</td>
                  <td className="p-2">Integer</td>
                  <td className="p-2">Power in PS (Pferdestärke)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">images (array)</td>
                  <td className="p-2">vehicle_images (table)</td>
                  <td className="p-2">Relational</td>
                  <td className="p-2">Separate table with sort_order</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">features (array)</td>
                  <td className="p-2">-</td>
                  <td className="p-2">Deprecated</td>
                  <td className="p-2">Replaced by structured fields</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryFieldMapper;
