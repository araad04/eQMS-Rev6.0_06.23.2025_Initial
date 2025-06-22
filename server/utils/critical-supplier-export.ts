import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from '../db';
import { suppliers, supplierCategories, supplierStatuses, supplierAssessments, supplierCertifications, supplierProductCategories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface CriticalSupplierData {
  id: number;
  supplierId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  criticality: string;
  currentRiskLevel: string;
  categoryName: string;
  statusName: string;
  activitiesPerformed: string[];
  controlsApplied: string[];
  certifications: string[];
  lastAssessmentDate: string | null;
  nextAssessmentDue: string | null;
  qualificationStatus: string;
}

export async function getCriticalSuppliersData(): Promise<CriticalSupplierData[]> {
  try {
    // Get critical suppliers with related data
    const criticalSuppliers = await db
      .select({
        id: suppliers.id,
        supplierId: suppliers.supplierId,
        name: suppliers.name,
        address: suppliers.address,
        city: suppliers.city,
        state: suppliers.state,
        country: suppliers.country,
        postalCode: suppliers.postalCode,
        contactName: suppliers.contactName,
        contactEmail: suppliers.contactEmail,
        contactPhone: suppliers.contactPhone,
        criticality: suppliers.criticality,
        currentRiskLevel: suppliers.currentRiskLevel,
        categoryName: supplierCategories.name,
        statusName: supplierStatuses.name,
        qualificationDate: suppliers.qualificationDate,
        requalificationDate: suppliers.requalificationDate
      })
      .from(suppliers)
      .leftJoin(supplierCategories, eq(suppliers.categoryId, supplierCategories.id))
      .leftJoin(supplierStatuses, eq(suppliers.statusId, supplierStatuses.id))
      .where(and(
        eq(suppliers.criticality, 'Critical'),
        eq(suppliers.isArchived, false)
      ));

    // Get activities, controls, and certifications for each critical supplier
    const criticalSuppliersData: CriticalSupplierData[] = [];

    for (const supplier of criticalSuppliers) {
      // Get product categories (activities performed)
      const productCategories = await db
        .select({ categoryName: supplierProductCategories.categoryName })
        .from(supplierProductCategories)
        .where(eq(supplierProductCategories.supplierId, supplier.id));

      // Get latest assessment for controls applied
      const latestAssessment = await db
        .select({
          conductedDate: supplierAssessments.conductedDate,
          scheduledDate: supplierAssessments.scheduledDate,
          findings: supplierAssessments.findings,
          suggestions: supplierAssessments.suggestions,
          assessmentType: supplierAssessments.assessmentType,
          score: supplierAssessments.score
        })
        .from(supplierAssessments)
        .where(eq(supplierAssessments.supplierId, supplier.id))
        .orderBy(supplierAssessments.conductedDate)
        .limit(1);

      // Get certifications
      const certifications = await db
        .select({
          name: supplierCertifications.name,
          certificationNumber: supplierCertifications.certificationNumber,
          issuingBody: supplierCertifications.issuingBody,
          expiryDate: supplierCertifications.expiryDate
        })
        .from(supplierCertifications)
        .where(eq(supplierCertifications.supplierId, supplier.id));

      // Determine qualification status
      const qualificationStatus = supplier.qualificationDate ? 
        (supplier.requalificationDate && new Date(supplier.requalificationDate) < new Date() ? 
          'Requalification Due' : 'Qualified') : 'Not Qualified';

      // Build controls applied array
      const controlsApplied: string[] = [];
      if (latestAssessment.length > 0) {
        if (latestAssessment[0].findings) {
          controlsApplied.push(`Assessment Findings: ${latestAssessment[0].findings}`);
        }
        if (latestAssessment[0].suggestions) {
          controlsApplied.push(`Improvement Recommendations: ${latestAssessment[0].suggestions}`);
        }
        if (latestAssessment[0].assessmentType) {
          controlsApplied.push(`Latest Assessment Type: ${latestAssessment[0].assessmentType}`);
        }
      }

      // Add standard quality controls for critical suppliers
      controlsApplied.push('Quality Agreement Required');
      controlsApplied.push('Regular Assessment Monitoring');
      controlsApplied.push('Enhanced Documentation Requirements');
      controlsApplied.push('Expedited CAPA Response Required');

      criticalSuppliersData.push({
        id: supplier.id,
        supplierId: supplier.supplierId,
        name: supplier.name,
        address: `${supplier.address}, ${supplier.city}${supplier.state ? `, ${supplier.state}` : ''}, ${supplier.country}${supplier.postalCode ? ` ${supplier.postalCode}` : ''}`,
        city: supplier.city,
        state: supplier.state || '',
        country: supplier.country,
        postalCode: supplier.postalCode || '',
        contactName: supplier.contactName,
        contactEmail: supplier.contactEmail,
        contactPhone: supplier.contactPhone,
        criticality: supplier.criticality,
        currentRiskLevel: supplier.currentRiskLevel || 'Not Assessed',
        categoryName: supplier.categoryName || 'Uncategorized',
        statusName: supplier.statusName || 'Unknown',
        activitiesPerformed: productCategories.map(cat => cat.categoryName),
        controlsApplied,
        certifications: certifications.map(cert => 
          `${cert.name}${cert.certificationNumber ? ` (${cert.certificationNumber})` : ''}${cert.issuingBody ? ` - ${cert.issuingBody}` : ''}`
        ),
        lastAssessmentDate: latestAssessment.length > 0 && latestAssessment[0].conductedDate ? 
          latestAssessment[0].conductedDate.toISOString().split('T')[0] : null,
        nextAssessmentDue: latestAssessment.length > 0 && latestAssessment[0].scheduledDate ? 
          latestAssessment[0].scheduledDate.toISOString().split('T')[0] : null,
        qualificationStatus
      });
    }

    return criticalSuppliersData;
  } catch (error) {
    console.error('Error fetching critical suppliers data:', error);
    throw new Error('Failed to fetch critical suppliers data');
  }
}

export async function generateCriticalSuppliersExcel(): Promise<Buffer> {
  const suppliers = await getCriticalSuppliersData();
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Critical Suppliers');

  // Add title and metadata
  worksheet.mergeCells('A1:M1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Critical Suppliers Report';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:M2');
  const metadataCell = worksheet.getCell('A2');
  metadataCell.value = `Generated on: ${new Date().toLocaleDateString()} | Total Critical Suppliers: ${suppliers.length}`;
  metadataCell.font = { size: 10, italic: true };
  metadataCell.alignment = { horizontal: 'center' };

  // Add headers
  const headers = [
    'Supplier ID',
    'Supplier Name',
    'Full Address',
    'Contact Person',
    'Contact Email',
    'Contact Phone',
    'Category',
    'Risk Level',
    'Activities Performed',
    'Controls Applied',
    'Certifications',
    'Qualification Status',
    'Last Assessment'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Add data rows
  suppliers.forEach(supplier => {
    const row = worksheet.addRow([
      supplier.supplierId,
      supplier.name,
      supplier.address,
      supplier.contactName,
      supplier.contactEmail,
      supplier.contactPhone,
      supplier.categoryName,
      supplier.currentRiskLevel,
      supplier.activitiesPerformed.join('; '),
      supplier.controlsApplied.join('; '),
      supplier.certifications.join('; '),
      supplier.qualificationStatus,
      supplier.lastAssessmentDate || 'Not Assessed'
    ]);

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50); // Cap at 50 characters
  });

  // Add summary section
  const summaryStartRow = worksheet.rowCount + 2;
  worksheet.mergeCells(`A${summaryStartRow}:M${summaryStartRow}`);
  const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
  summaryTitleCell.value = 'Critical Suppliers Summary';
  summaryTitleCell.font = { size: 14, bold: true };

  // Risk level distribution
  const riskLevels = suppliers.reduce((acc, supplier) => {
    acc[supplier.currentRiskLevel] = (acc[supplier.currentRiskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let summaryRow = summaryStartRow + 1;
  worksheet.getCell(`A${summaryRow}`).value = 'Risk Level Distribution:';
  worksheet.getCell(`A${summaryRow}`).font = { bold: true };

  Object.entries(riskLevels).forEach(([riskLevel, count]) => {
    summaryRow++;
    worksheet.getCell(`A${summaryRow}`).value = `${riskLevel}: ${count} suppliers`;
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

export async function generateCriticalSuppliersPDF(): Promise<Buffer> {
  const suppliers = await getCriticalSuppliersData();
  
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(16);
  doc.text('Critical Suppliers Report', 148, 20, { align: 'center' });
  
  // Add metadata
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Critical Suppliers: ${suppliers.length}`, 148, 30, { align: 'center' });

  // Prepare table data
  const tableData = suppliers.map(supplier => [
    supplier.supplierId,
    supplier.name,
    supplier.address.length > 40 ? supplier.address.substring(0, 37) + '...' : supplier.address,
    supplier.contactName,
    supplier.categoryName,
    supplier.currentRiskLevel,
    supplier.activitiesPerformed.join(', ').length > 30 ? 
      supplier.activitiesPerformed.join(', ').substring(0, 27) + '...' : 
      supplier.activitiesPerformed.join(', '),
    supplier.controlsApplied.length > 2 ? `${supplier.controlsApplied.length} controls applied` : 
      supplier.controlsApplied.join(', '),
    supplier.qualificationStatus
  ]);

  // Add table
  const autoTable = (doc as any).autoTable;
  autoTable({
    head: [['Supplier ID', 'Name', 'Address', 'Contact', 'Category', 'Risk Level', 'Activities', 'Controls', 'Status']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [230, 230, 250],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 35 },
      7: { cellWidth: 35 },
      8: { cellWidth: 25 }
    }
  });

  // Add summary section on new page if needed
  const pageHeight = doc.internal.pageSize.height;
  const currentY = (doc as any).lastAutoTable?.finalY || 40;
  
  if (currentY > pageHeight - 50) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Critical Suppliers Summary', 20, 30);
  } else {
    doc.setFontSize(14);
    doc.text('Critical Suppliers Summary', 20, currentY + 20);
  }

  // Risk level distribution
  const riskLevels = suppliers.reduce((acc, supplier) => {
    acc[supplier.currentRiskLevel] = (acc[supplier.currentRiskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  doc.setFontSize(10);
  let yPosition = currentY > pageHeight - 50 ? 45 : currentY + 35;
  
  doc.text('Risk Level Distribution:', 20, yPosition);
  yPosition += 10;

  Object.entries(riskLevels).forEach(([riskLevel, count]) => {
    doc.text(`${riskLevel}: ${count} suppliers`, 25, yPosition);
    yPosition += 8;
  });

  // Add compliance note
  yPosition += 10;
  doc.setFontSize(8);
  doc.text('Note: This report contains critical suppliers requiring enhanced monitoring and controls per ISO 13485:2016 requirements.', 20, yPosition);

  return Buffer.from(doc.output('arraybuffer'));
}