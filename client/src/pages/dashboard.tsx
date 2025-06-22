import { UnifiedKPIDashboard } from "@/components/dashboard/unified-kpi-dashboard";
import { QualityPulseWidget } from "@/components/dashboard/widget-components";
import { 
  Zap
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Quality Command Center
              </h1>
              <p className="text-xl text-cyan-200 mt-3 font-light">Real-time medical device quality intelligence</p>
            </div>
          </div>
        </div>

        {/* Unified KPI Dashboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <UnifiedKPIDashboard />
        </div>

        {/* Quality Pulse Widget */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <QualityPulseWidget />
        </div>
      </div>
    </div>
  );
}