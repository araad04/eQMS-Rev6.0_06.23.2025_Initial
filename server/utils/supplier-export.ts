import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface Supplier {
  id: number;
  supplierId: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  criticality: string;
  currentRiskLevel: string;
  qualificationDate: string | null;
  requalificationDate: string | null;
  hasQualityAgreement: boolean;
  hasNda: boolean;
  website: string;
  statusId: number;
}

interface ExportOptions {
  format: 'pdf' | 'excel';
  columns: string[];
  approvedOnly: boolean;
}

const columnLabels: Record<string, string> = {
  supplierId: 'Supplier ID',
  name: 'Supplier Name',
  contactName: 'Contact Name',
  contactEmail: 'Contact Email',
  contactPhone: 'Contact Phone',
  fullAddress: 'Address',
  country: 'Country',
  criticality: 'Criticality',
  currentRiskLevel: 'Risk Level',
  qualificationDate: 'Qualification Date',
  requalificationDate: 'Requalification Date',
  hasQualityAgreement: 'Quality Agreement',
  hasNda: 'NDA Status',
  website: 'Website',
};

export async function exportSuppliers(
  suppliers: Supplier[],
  options: ExportOptions
): Promise<Buffer> {
  // Filter suppliers if needed
  let filteredSuppliers = suppliers;
  if (options.approvedOnly) {
    filteredSuppliers = suppliers.filter(s => s.statusId === 3); // Assuming statusId 3 = Approved
  }

  if (options.format === 'excel') {
    return await generateExcel(filteredSuppliers, options.columns);
  } else {
    return await generatePDF(filteredSuppliers, options.columns);
  }
}

async function generateExcel(suppliers: Supplier[], columns: string[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Approved Suppliers');

  // Set up headers
  const headers = columns.map(col => columnLabels[col] || col);
  worksheet.addRow(headers);

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '366092' }
  };
  headerRow.alignment = { horizontal: 'center' };

  // Add data rows
  suppliers.forEach(supplier => {
    const rowData = columns.map(col => {
      if (col === 'fullAddress') {
        // Combine address components into a single field
        const addressParts = [
          supplier.address,
          supplier.city,
          supplier.state,
          supplier.postalCode
        ].filter(part => part && part.trim() !== '');
        return addressParts.join(', ');
      }
      
      const value = supplier[col as keyof Supplier];
      
      if (col === 'qualificationDate' || col === 'requalificationDate') {
        return value ? format(new Date(value), 'MMM dd, yyyy') : 'Not set';
      }
      
      if (col === 'hasQualityAgreement' || col === 'hasNda') {
        return value ? 'Yes' : 'No';
      }
      
      return value || '';
    });
    worksheet.addRow(rowData);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  // Add filters
  worksheet.autoFilter = {
    from: 'A1',
    to: `${String.fromCharCode(64 + columns.length)}${suppliers.length + 1}`
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generatePDF(suppliers: Supplier[], columns: string[]): Promise<Buffer> {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

  // Add title
  pdf.setFontSize(16);
  pdf.text('Approved Supplier List', 20, 20);
  
  // Add generation date
  pdf.setFontSize(10);
  pdf.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 30);
  pdf.text(`Total Suppliers: ${suppliers.length}`, 20, 35);

  // Prepare table data
  const headers = columns.map(col => columnLabels[col] || col);
  const data = suppliers.map(supplier => 
    columns.map(col => {
      if (col === 'fullAddress') {
        // Combine address components into a single field
        const addressParts = [
          supplier.address,
          supplier.city,
          supplier.state,
          supplier.postalCode
        ].filter(part => part && part.trim() !== '');
        return addressParts.join(', ');
      }
      
      const value = supplier[col as keyof Supplier];
      
      if (col === 'qualificationDate' || col === 'requalificationDate') {
        return value ? format(new Date(value), 'MMM dd, yyyy') : 'Not set';
      }
      
      if (col === 'hasQualityAgreement' || col === 'hasNda') {
        return value ? 'Yes' : 'No';
      }
      
      return String(value || '');
    })
  );

  // Add table
  (pdf as any).autoTable({
    head: [headers],
    body: data,
    startY: 45,
    theme: 'grid',
    headStyles: {
      fillColor: [54, 96, 146],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = { cellWidth: 'auto' };
      return acc;
    }, {} as any)
  });

  return Buffer.from(pdf.output('arraybuffer'));
}