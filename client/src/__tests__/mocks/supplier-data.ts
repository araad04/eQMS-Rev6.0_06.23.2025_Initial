/**
 * Reference data structures for supplier management
 * Contains only data structure definitions and reference lists
 */

// Empty suppliers array - actual data should come from database
export const mockSuppliers: any[] = [];

// Reference data for supplier forms
export const supplierCategories = [
  { id: 1, name: "Component Supplier" },
  { id: 2, name: "Electronics Supplier" },
  { id: 3, name: "Materials Supplier" },
  { id: 4, name: "Manufacturing Service" },
  { id: 5, name: "Packaging Supplier" },
  { id: 6, name: "Software Supplier" },
  { id: 7, name: "Calibration Service" },
  { id: 8, name: "Testing Service" }
];

export const supplierStatuses = [
  { id: 1, name: "Approved" },
  { id: 2, name: "Pending" },
  { id: 3, name: "Disqualified" },
  { id: 4, name: "Under Review" }
];

export const criticalityLevels = [
  { id: 1, name: "Critical", description: "Supplier provides components or services that directly impact product safety or efficacy" },
  { id: 2, name: "Major", description: "Supplier provides components or services with indirect impact on product performance" },
  { id: 3, name: "Minor", description: "Supplier provides components or services with minimal impact on final product" }
];

export const riskLevels = [
  { id: 1, name: "High", description: "High risk requiring frequent monitoring and audits" },
  { id: 2, name: "Medium", description: "Moderate risk requiring regular monitoring" },
  { id: 3, name: "Low", description: "Low risk requiring standard monitoring" }
];

export const productCategories = [
  { id: 1, name: "Valves" },
  { id: 2, name: "Connectors" },
  { id: 3, name: "Tubes" },
  { id: 4, name: "PCB Assemblies" },
  { id: 5, name: "Electronic Components" },
  { id: 6, name: "Sensors" },
  { id: 7, name: "Biocompatible Polymers" },
  { id: 8, name: "Hydrogels" },
  { id: 9, name: "Coatings" },
  { id: 10, name: "Injection Molding" },
  { id: 11, name: "Tool Manufacturing" },
  { id: 12, name: "Sterile Packaging" },
  { id: 13, name: "Labeling" },
  { id: 14, name: "Shipping Containers" }
];