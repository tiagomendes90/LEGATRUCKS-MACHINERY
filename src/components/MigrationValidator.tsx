
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Database, FileCheck } from 'lucide-react';
import { validateDatabaseStructure, MigrationValidationResult } from '@/utils/migrationHelpers';

const MigrationValidator = () => {
  const [validationResult, setValidationResult] = useState<MigrationValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidation = async () => {
    setIsValidating(true);
    try {
      const result = await validateDatabaseStructure();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [`Validation failed: ${error}`],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Migration Validator
        </CardTitle>
        <CardDescription>
          Validate the database structure and readiness for migration to the new vehicle system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleValidation} 
          disabled={isValidating}
          className="w-full"
        >
          <FileCheck className="h-4 w-4 mr-2" />
          {isValidating ? 'Validating...' : 'Run Database Validation'}
        </Button>

        {validationResult && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className="font-medium">
                  {validationResult.isValid 
                    ? 'Database structure is valid and ready for migration' 
                    : 'Database structure has issues that need to be resolved'}
                </AlertDescription>
              </div>
            </Alert>

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-700">Errors ({validationResult.errors.length})</span>
                </div>
                {validationResult.errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-700">Warnings ({validationResult.warnings.length})</span>
                </div>
                {validationResult.warnings.map((warning, index) => (
                  <Alert key={index} className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Migration Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Migration Status:</span>
              <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                {validationResult.isValid ? "Ready" : "Not Ready"}
              </Badge>
            </div>
          </div>
        )}

        {/* Migration Checklist */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-900">Migration Checklist:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ New database structure created</li>
            <li>✓ Categories and subcategories defined</li>
            <li>✓ Vehicle brands populated</li>
            <li>→ Test vehicle insertions</li>
            <li>→ Frontend integration testing</li>
            <li>→ Featured vehicles setup</li>
            <li>→ Old structure deactivation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MigrationValidator;
