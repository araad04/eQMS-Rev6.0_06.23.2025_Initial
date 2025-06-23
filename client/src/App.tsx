import React, { Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/layout";
import { Loader2 } from "lucide-react";

// Pages
import Dashboard from "./pages/dashboard";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";

// Module Pages
import DesignControlPage from "./pages/design-control";
import DesignControlDashboard from "./pages/design-control-dashboard";
import CreateDesignProjectPage from "./pages/design-control/create";
import SoftwareProjectCreatePage from "./pages/design-control/software-project-create";
import IOVVTestExecutionPage from "./pages/design-control/iovv-test-execution";
import CAPAManagementPage from "./pages/capa-management";
import CreateCAPAPage from "./pages/capa-management/create";
import TrainingRecordsPage from "./pages/training-records";
import DocumentControlPage from "./pages/document-control";
import CreateDocumentPage from "./pages/document-control/create";
import DocumentAnalyticsPage from "./pages/document-control/analytics";
import MeasurementAnalysisPage from "./pages/measurement-analysis";
import SupplierManagementPage from './pages/supplier-management/index';
// Import the detail page directly from its file path
import SupplierDetailPage from './pages/supplier-management/detail';
import CreateSupplierPage from "./pages/supplier-management/create";
import AuditManagementPage from "./pages/audit-management";
import AuditCreatePage from "./pages/audit-create";
import ManagementReviewPage from "./pages/management-review-page";
import ManagementReviewList from "./pages/management-review/index";
import CreateManagementReview from "./pages/management-review/create";
import ComplaintManagement from "./pages/complaint-management";
import ComplaintCreate from "./pages/complaint-create";
import CustomerFeedbackPage from "./pages/customer-feedback";
import UserManagementPage from "./pages/user-management";
import SystemAnalyticsPage from "./pages/system-analytics";
import OrganizationalChartPage from "./pages/organizational-chart-professional";
import TechnicalDocumentationPage from "./pages/TechnicalDocumentation";
import StorageSettingsPage from "./pages/storage-settings";
import EnhancedDesignControl from "./pages/design-control/enhanced-design-control";
import DesignPlanDashboard from "./pages/design-control/design-plan-dashboard";
const TechnicalDocumentationInteractive = React.lazy(() => import("./pages/TechnicalDocumentationInteractive"));

// Route handler component for module pages that are not yet implemented
const ModulePage = () => {
  const [location] = useLocation();

            <Route path="/design-control/enhanced-steering" component={() => (
              <ProtectedRoute>
                <React.Suspense fallback={<div>Loading...</div>}>
                  {React.createElement(React.lazy(() => import('./pages/design-control/enhanced-steering-module-fixed')))}
                </React.Suspense>
              </ProtectedRoute>
            )} />

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4">{getPageTitle(location)}</h1>
      <div className="p-6 bg-card border rounded-lg shadow-sm">
        <p className="text-lg text-muted-foreground mb-4">
          This module is currently under development.
        </p>
        <p className="text-muted-foreground">
          The {getPageTitle(location)} module will be implemented in an upcoming sprint. 
          Please check back soon for updates.
        </p>
      </div>
    </div>
  );
};

// Helper function to convert route to title
function getPageTitle(path: string) {
  // Extract the main part of the path (excluding query params)
  const mainPath = path.split('?')[0];

  // Split by slashes and get the last part
  const parts = mainPath.split('/').filter(Boolean);
  if (parts.length === 0) return 'Dashboard';

  // Convert kebab-case to Title Case
  return parts[0]
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/auth">
          <AuthPage />
        </Route>

        {/* Home route - protected */}
        <ProtectedRoute path="/" component={() => (
          <Layout>
            <Dashboard />
          </Layout>
        )} />

        {/* Document Control Module Routes */}
        <ProtectedRoute path="/document-control/create" component={() => (
          <Layout>
            <CreateDocumentPage />
          </Layout>
        )} />

        <ProtectedRoute path="/document-control/pending" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/document-control/pending")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/document-control/edit/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/document-control/edit/index")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/document-control/document/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/document-control/document/index")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/document-control/analytics" component={() => (
          <Layout>
            <DocumentAnalyticsPage />
          </Layout>
        )} />

        <ProtectedRoute path="/document-control" component={() => (
          <Layout>
            <DocumentControlPage />
          </Layout>
        )} />

        {/* Supplier Management Module Routes */}
        <ProtectedRoute path="/supplier-management/create" component={() => (
          <Layout>
            <CreateSupplierPage />
          </Layout>
        )} />

        <ProtectedRoute path="/supplier-management/view/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/supplier-management/detail-view")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/supplier-management" component={() => (
          <Layout>
            <SupplierManagementPage />
          </Layout>
        )} />

        {/* This route is already handled above */}
        {/* <ProtectedRoute path="/supplier-management" component={SupplierManagementPage} /> */}
        {/* <Route path="/supplier-management/view/:id" component={SupplierDetailPage} /> */}

        <ProtectedRoute path="/supplier-management/detail" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/supplier-management/detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />
        
        <ProtectedRoute path="/supplier-management/edit/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/supplier-management/edit")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />
        
        <ProtectedRoute path="/supplier-management/regulatory-reportability/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/supplier-management/regulatory-reportability")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />
        
        <ProtectedRoute path="/supplier-management/assessments/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/supplier-management/assessments")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/supplier-management/assessments" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/supplier-management/assessments")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />
        
        <ProtectedRoute path="/supplier-management/regulatory-reportability/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/supplier-management/regulatory-reportability")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        {/* Measurement & Analysis Module Routes */}
        <ProtectedRoute path="/measurement-analysis" component={() => (
          <Layout>
            <MeasurementAnalysisPage />
          </Layout>
        )} />

        <ProtectedRoute path="/measurement-analysis/complaints" component={() => (
          <Layout>
            <ComplaintManagement />
          </Layout>
        )} />

        <ProtectedRoute path="/measurement-analysis/feedback" component={() => (
          <Layout>
            <CustomerFeedbackPage />
          </Layout>
        )} />

        {/* Design Control Module Routes */}
        <ProtectedRoute path="/design-control/create" component={() => (
          <Layout>
            <CreateDesignProjectPage />
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/software-project-create" component={() => (
          <Layout>
            <SoftwareProjectCreatePage />
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/project/:projectId" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/enhanced-project-workspace")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/iovv/:id" component={() => (
          <Layout>
            <IOVVTestExecutionPage />
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/inputs" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/inputs")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/outputs" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/outputs")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/templates" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/templates")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/verification" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/verification")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/validation" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/validation")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/design-plan" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/design-plan")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/dynamic-traceability" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/dynamic-traceability")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/traceability" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/traceability")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/history-file" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/history-file")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/projects" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/all-projects")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/all-projects")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/enhanced" component={() => (
          <Layout>
            <EnhancedDesignControl />
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/projects/:projectId/plan" component={() => (
          <Layout>
            <DesignPlanDashboard />
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/projects/:projectId/phase-workflow" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/design-control/phase-workflow")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/design-control" component={() => (
          <Layout>
            <DesignControlDashboard />
          </Layout>
        )} />

        {/* CAPA Management Module Routes */}
        <ProtectedRoute path="/capa-management/create" component={() => (
          <Layout>
            <CreateCAPAPage />
          </Layout>
        )} />

        <ProtectedRoute path="/capa-management/edit/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/capa-edit")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/capa-management/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/capa-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/capa-management" component={() => (
          <Layout>
            <CAPAManagementPage />
          </Layout>
        )} />

        <ProtectedRoute path="/audit-management" component={() => (
          <Layout>
            <AuditManagementPage />
          </Layout>
        )} />

        <ProtectedRoute path="/audit-create" component={() => (
          <Layout>
            <AuditCreatePage />
          </Layout>
        )} />

        {/* Internal Audit Module Routes */}
        <ProtectedRoute path="/internal-audit/schedule" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/internal-audit/schedule")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/internal-audit/checklist-demo" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/internal-audit/checklist-demo")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/internal-audit/:id/checklist" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/internal-audit/checklist")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/internal-audit/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/internal-audit/detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/internal-audit" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/internal-audit/index")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/audit-detail/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/audit-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/audit-checklist-create/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/audit-checklist-create")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/audit-edit/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/audit-edit")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        {/* Training Records Module Routes */}
        <ProtectedRoute path="/training-records/assign" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/training-records/assign")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/training-records/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/training-records/detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/training-records" component={() => (
          <Layout>
            <TrainingRecordsPage />
          </Layout>
        )} />

        {/* Production Module Routes */}
        <ProtectedRoute path="/maintenance-assets/add" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/maintenance-assets/add")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/maintenance-assets" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/maintenance-assets")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/production/products/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              {/* Import dynamically to improve initial load time */}
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/production-product-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/production/products" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              {/* Import dynamically to improve initial load time */}
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/production-products")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/production/batches/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              {/* Import dynamically to improve initial load time */}
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/production-batch-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/production/batches" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              {/* Import dynamically to improve initial load time */}
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/production-batches")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/production/nonconforming-product-form" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/production/nonconforming-product-form")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />
        
        <ProtectedRoute path="/production/nonconforming-products/:id" component={() => {
          const NonconformingProductDetail = React.lazy(() => import("./pages/production/nonconforming-product-detail"));
          return (
            <Layout>
              <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
                <NonconformingProductDetail />
              </Suspense>
            </Layout>
          );
        }} />

        <ProtectedRoute path="/production/nonconforming-products" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/production/nonconforming-products")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        {/* Risk Assessment Routes */}


        {/* Design Control Module Routes */}
        <ProtectedRoute path="/design-control/create" component={() => (
          <Layout>
            <CreateDesignProjectPage />
          </Layout>
        )} />

        <ProtectedRoute path="/design-control/test/:type/:id" component={() => (
          <Layout>
            <IOVVTestExecutionPage />
          </Layout>
        )} />



        <ProtectedRoute path="/design-control" component={() => (
          <Layout>
            <DesignControlPage />
          </Layout>
        )} />

        {/* Removed catch-all supplier management route since we have implemented it */}

        <ProtectedRoute path="/critical-suppliers" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/critical-suppliers")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        {/* Supplier Assessment removed - now automatically triggered based on risk/criticality */}

        <ProtectedRoute path="/measurement-analysis/complaints/create" component={() => (
          <Layout>
            <ComplaintCreate />
          </Layout>
        )} />

        <ProtectedRoute path="/measurement-analysis/complaints/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/complaint-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/measurement-analysis/complaints" component={() => (
          <Layout>
            <ComplaintManagement />
          </Layout>
        )} />

        <ProtectedRoute path="/measurement-analysis/feedback/create" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/feedback-create")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/measurement-analysis/feedback/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/feedback-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/measurement-analysis/feedback" component={() => (
          <Layout>
            <CustomerFeedbackPage />
          </Layout>
        )} />

        <ProtectedRoute path="/calibration-assets" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/calibration-assets")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />



        <ProtectedRoute path="/measurement-analysis/:rest*" component={() => (
          <Layout>
            <ModulePage />
          </Layout>
        )} />

        <ProtectedRoute path="/management-review/create" component={() => (
          <Layout>
            <CreateManagementReview />
          </Layout>
        )} />

        <ProtectedRoute path="/management-review/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/management-review-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/management-review" component={() => (
          <Layout>
            <ManagementReviewList />
          </Layout>
        )} />





        <ProtectedRoute path="/user-management/create" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/user-management/create")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/user-management/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/user-detail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/user-management" component={() => (
          <Layout>
            <UserManagementPage />
          </Layout>
        )} />

        <ProtectedRoute path="/storage-settings" component={() => (
          <Layout>
            <StorageSettingsPage />
          </Layout>
        )} />

        <ProtectedRoute path="/system-analytics" component={() => (
          <Layout>
            <SystemAnalyticsPage />
          </Layout>
        )} />

        <ProtectedRoute path="/organizational-chart" component={() => (
          <Layout>
            <OrganizationalChartPage />
          </Layout>
        )} />

        {/* Technical Documentation Module Routes */}
        <ProtectedRoute path="/technical-documentation/:id" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/TechnicalDocumentationDetail")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/technical-documentation" component={() => (
          <Layout>
            <TechnicalDocumentationPage />
          </Layout>
        )} />

        <ProtectedRoute path="/technical-documentation-interactive" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <TechnicalDocumentationInteractive />
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/settings/api-test" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/settings/api-test")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/settings" component={() => (
          <Layout>
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
              <React.Suspense>
                {React.createElement(React.lazy(() => import("./pages/settings")))}
              </React.Suspense>
            </Suspense>
          </Layout>
        )} />

        <ProtectedRoute path="/settings/:rest*" component={() => (
          <Layout>
            <ModulePage />
          </Layout>
        )} />

        {/* Catch-all route for 404 */}
        <Route>
          <Layout>
            <NotFound />
          </Layout>
        </Route>
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}

export default App;