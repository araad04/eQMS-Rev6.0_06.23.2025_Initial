import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { calculateRequalificationDate, SUPPLIER_CRITICALITY_CONFIG } from "@/utils/supplier-criticality";

export function RequalificationDemo() {
  const [selectedCriticality, setSelectedCriticality] = useState<string>("Critical");
  const [qualificationDate, setQualificationDate] = useState<Date>(new Date());
  const [calculatedDate, setCalculatedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedCriticality && qualificationDate) {
      try {
        const requalDate = calculateRequalificationDate(qualificationDate, selectedCriticality);
        setCalculatedDate(requalDate);
      } catch (error) {
        console.error('Error calculating requalification date:', error);
        setCalculatedDate(null);
      }
    }
  }, [selectedCriticality, qualificationDate]);

  const setTodayAsQualification = () => {
    setQualificationDate(new Date());
  };

  const setLastYearAsQualification = () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    setQualificationDate(lastYear);
  };

  const config = SUPPLIER_CRITICALITY_CONFIG[selectedCriticality];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Automatic Requalification Date Calculator
        </CardTitle>
        <CardDescription>
          Demonstrates automatic date calculation based on supplier criticality levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier Criticality</label>
            <Select value={selectedCriticality} onValueChange={setSelectedCriticality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">Critical (1 year)</SelectItem>
                <SelectItem value="Major">Major (2 years)</SelectItem>
                <SelectItem value="Minor">Minor (4 years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Test Qualification Date</label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={setTodayAsQualification}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={setLastYearAsQualification}
              >
                Last Year
              </Button>
            </div>
          </div>
        </div>

        {config && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={config.riskLevel === 'high' ? 'destructive' : config.riskLevel === 'medium' ? 'default' : 'secondary'}>
                {config.riskLevel.toUpperCase()} RISK
              </Badge>
              <span className="text-sm font-medium">{selectedCriticality} Supplier</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{config.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Qualification Date</p>
                  <p className="text-sm text-gray-600">{qualificationDate.toLocaleDateString()}</p>
                </div>
              </div>

              {calculatedDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Calculated Requalification Date</p>
                    <p className="text-sm text-green-700 font-medium">{calculatedDate.toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-medium mb-2">Calculation Rules:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• <strong>Critical suppliers:</strong> Requalification required every 1 year</p>
            <p>• <strong>Major suppliers:</strong> Requalification required every 2 years</p>
            <p>• <strong>Minor suppliers:</strong> Requalification required every 4 years</p>
          </div>
        </div>

        {calculatedDate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Automatic Calculation Complete</p>
                <p className="text-sm text-green-700">
                  Based on the {selectedCriticality.toLowerCase()} criticality level, the supplier must be requalified by{' '}
                  <strong>{calculatedDate.toLocaleDateString()}</strong>
                  {' '}({config?.requalificationInterval} year{config?.requalificationInterval !== 1 ? 's' : ''} from qualification date)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}