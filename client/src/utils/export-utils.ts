import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

// Type for export options
export interface ExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
  filterInfo?: string;
  logo?: string;
  footerText?: string;
}

// PDF export function
export function exportToPdf<T extends Record<string, any>>(
  data: T[],
  columns: { header: string; key: keyof T; formatter?: (value: any) => string }[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'export',
    includeTimestamp = true,
    orientation = 'portrait',
    title = 'Export Data',
    subtitle = '',
    filterInfo = '',
    footerText = '',
  } = options;

  // Create filename with timestamp if needed
  const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
  const fullFilename = `${filename}${timestamp}.pdf`;

  // Initialize PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Add document title
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.text(subtitle, 14, 30);
  }

  // Add filter information if provided
  if (filterInfo) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Filters: ${filterInfo}`, 14, subtitle ? 38 : 30);
  }

  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 14, subtitle ? (filterInfo ? 46 : 38) : (filterInfo ? 38 : 30));

  // Prepare table data
  const tableColumn = columns.map(col => col.header);
  const tableRows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      if (col.formatter) {
        return col.formatter(value);
      }
      if (value instanceof Date) {
        return format(value, 'PP');
      }
      return value !== null && value !== undefined ? String(value) : '';
    })
  );

  // Create table
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: subtitle ? (filterInfo ? 50 : 42) : (filterInfo ? 42 : 34),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
      lineColor: [200, 200, 200],
    },
    headStyles: {
      fillColor: [44, 75, 122],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  // Add footer
  if (footerText) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.getWidth();
      const pageHeight = pageSize.getHeight();
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Add page numbers
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10);
    }
  }

  // Save the PDF
  doc.save(fullFilename);
}

// Excel export function
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: { header: string; key: keyof T; formatter?: (value: any) => string }[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'export',
    includeTimestamp = true,
    title = 'Export Data',
  } = options;

  // Create filename with timestamp if needed
  const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
  const fullFilename = `${filename}${timestamp}.xlsx`;

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'eQMS';
  workbook.lastModifiedBy = 'eQMS System';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Add a worksheet
  const worksheet = workbook.addWorksheet('Data');
  
  // Add column headers
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key.toString(),
    width: 20  // Default column width
  }));
  
  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Add data rows
  data.forEach(item => {
    const rowData: Record<string, any> = {};
    
    columns.forEach(col => {
      const value = item[col.key];
      if (col.formatter && value !== null && value !== undefined) {
        rowData[col.key.toString()] = col.formatter(value);
      } else if (value instanceof Date) {
        rowData[col.key.toString()] = format(value, 'PP');
      } else {
        rowData[col.key.toString()] = value !== null && value !== undefined ? value : '';
      }
    });
    
    worksheet.addRow(rowData);
  });
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Save file using file-saver
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fullFilename);
}