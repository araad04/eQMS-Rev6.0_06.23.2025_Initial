import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock, Shield, Calendar } from "lucide-react";
import { 
  SUPPLIER_CRITICALITY_CONFIG,
  calculateRequalificationDate,
  formatRequalificationInterval,
  formatAuditInterval,
  isRequalificationDue,
  getDaysUntilRequalification
} from "@/utils/supplier-criticality";

interface CriticalityInfoProps {
  criticality: string;
  qualificationDate?: string | null;
  requalificationDate?: string | null;
  onRequalificationDateChange?: (date: string) => void;
}

export function CriticalityInfo({ 
  criticality, 
  qualificationDate, 
  requalificationDate,
  onRequalificationDateChange 
}: CriticalityInfoProps) {
  const config = SUPPLIER_CRITICALITY_CONFIG[criticality];
  
  // Calculate automatic requalification date when qualification date changes
  const calculateAutomaticRequalificationDate = () => {
    if (!qualificationDate || !config) return null;
    
    try {
      const qualDate = new Date(qualificationDate);
      const requaliDate = calculateRequalificationDate(qualDate, criticality);
      return requaliDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating requalification date:', error);
      return null;
    }
  };

  const automaticRequalificationDate = calculateAutomaticRequalificationDate();
  
  // Update parent component if automatic date differs from current
  if (automaticRequalificationDate && automaticRequalificationDate !== requalificationDate && onRequalificationDateChange) {
    onRequalificationDateChange(automaticRequalificationDate);
  }

  // Check if requalification is due
  const currentRequalDate = requalificationDate || automaticRequalificationDate;
  const isDue = currentRequalDate ? isRequalificationDue(new Date(currentRequalDate)) : false;
  const daysUntil = currentRequalDate ? getDaysUntilRequalification(new Date(currentRequalDate)) : null;

  if (!config) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Invalid Criticality</AlertTitle>
        <AlertDescription>
          The selected criticality level is not recognized. Please select a valid criticality level.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Supplier Criticality: {criticality}
            <Badge variant={config.riskLevel === 'high' ? 'destructive' : config.riskLevel === 'medium' ? 'default' : 'secondary'}>
              {config.riskLevel.toUpperCase()} RISK
            </Badge>
          </CardTitle>
          <CardDescription>
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Requalification Interval</span>
              </div>
              <p className="text-sm text-gray-600">
                Every {formatRequalificationInterval(criticality)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium">Audit Interval</span>
              </div>
              <p className="text-sm text-gray-600">
                {formatAuditInterval(criticality)}
              </p>
            </div>
          </div>

          {qualificationDate && automaticRequalificationDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800 text-sm">
                    Automatic Requalification Date Calculated
                  </p>
                  <p className="text-blue-700 text-sm">
                    Based on qualification date ({new Date(qualificationDate).toLocaleDateString()}) 
                    and {criticality.toLowerCase()} criticality level: <strong>{new Date(automaticRequalificationDate).toLocaleDateString()}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentRequalDate && isDue && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Requalification Overdue</AlertTitle>
              <AlertDescription>
                This supplier's requalification was due on {new Date(currentRequalDate).toLocaleDateString()}. 
                Immediate action required for regulatory compliance.
              </AlertDescription>
            </Alert>
          )}

          {currentRequalDate && !isDue && daysUntil !== null && daysUntil <= 90 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Requalification Due Soon</AlertTitle>
              <AlertDescription>
                Requalification is due in {daysUntil} days ({new Date(currentRequalDate).toLocaleDateString()}). 
                Consider initiating the requalification process.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quality & Compliance Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
              <div>
                <p className="font-medium text-sm">Enhanced Documentation</p>
                <p className="text-xs text-gray-600">Quality agreements and regulatory compliance documentation required</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
              <div>
                <p className="font-medium text-sm">Regular Assessments</p>
                <p className="text-xs text-gray-600">Periodic evaluation of supplier performance and compliance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
              <div>
                <p className="font-medium text-sm">Risk Monitoring</p>
                <p className="text-xs text-gray-600">Continuous monitoring of supplier risk factors and mitigation measures</p>
              </div>
            </div>
            
            {config.riskLevel === 'high' && (
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Expedited CAPA Response</p>
                  <p className="text-xs text-gray-600">Critical suppliers require immediate corrective action responses</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}