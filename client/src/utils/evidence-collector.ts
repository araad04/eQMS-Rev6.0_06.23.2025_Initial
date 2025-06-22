/**
 * Evidence Collector for IOVV Matrix Validation Tests
 * 
 * This utility provides functions to collect and manage evidence for validation tests,
 * supporting regulatory compliance requirements for medical device software validation.
 * 
 * Classification: Software Safety Class B (per IEC 62304)
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { ValidationTest } from './iovv-matrix';
import { registerEvidence } from './iovv-connect';

export enum EvidenceType {
  Screenshot = 'Screenshot',
  Document = 'Document',
  Log = 'Log',
  Other = 'Other'
}

export interface Evidence {
  id: string;
  testId: string;
  type: EvidenceType;
  description: string;
  timestamp: string;
  filename: string;
  size: number;
  mimeType: string;
  content?: Blob; // For local use, not stored in the database
}

/**
 * Take a screenshot of a DOM element as evidence
 * 
 * @param element The DOM element to capture
 * @param testId The ID of the validation test
 * @param description A description of the evidence
 * @returns Promise resolving to the evidence object
 */
export async function captureScreenshot(
  element: HTMLElement,
  testId: string,
  description: string
): Promise<Evidence> {
  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      logging: false,
      useCORS: true,
      scale: 2, // Higher quality
    });
    
    // Convert the canvas to a blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => {
        resolve(b!);
      }, 'image/png', 0.95);
    });
    
    // Create a unique filename
    const timestamp = new Date().toISOString();
    const filename = `screenshot-${testId}-${timestamp.replace(/[:.]/g, '-')}.png`;
    
    // Create the evidence object
    const evidence: Evidence = {
      id: uuidv4(),
      testId,
      type: EvidenceType.Screenshot,
      description,
      timestamp,
      filename,
      size: blob.size,
      mimeType: 'image/png',
      content: blob,
    };
    
    return evidence;
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    throw new Error(`Failed to capture screenshot: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a PDF document as evidence
 * 
 * @param title The title of the PDF
 * @param content The content of the PDF (HTML element or text)
 * @param testId The ID of the validation test
 * @param description A description of the evidence
 * @returns Promise resolving to the evidence object
 */
export async function generatePDFDocument(
  title: string,
  content: HTMLElement | string,
  testId: string,
  description: string
): Promise<Evidence> {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    // Add content
    doc.setFontSize(12);
    if (typeof content === 'string') {
      // If content is a string, add it as text
      const lines = doc.splitTextToSize(content, 170);
      doc.text(lines, 20, 40);
    } else {
      // If content is an HTML element, capture it as an image and add it
      const canvas = await html2canvas(content, {
        logging: false,
        useCORS: true,
        scale: 2,
      });
      
      // Convert the canvas to a data URL
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate the aspect ratio to fit within the page
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to the PDF
      doc.addImage(imgData, 'JPEG', 20, 40, imgWidth, imgHeight);
    }
    
    // Convert the PDF to a blob
    const blob = doc.output('blob');
    
    // Create a unique filename
    const timestamp = new Date().toISOString();
    const filename = `document-${testId}-${timestamp.replace(/[:.]/g, '-')}.pdf`;
    
    // Create the evidence object
    const evidence: Evidence = {
      id: uuidv4(),
      testId,
      type: EvidenceType.Document,
      description,
      timestamp,
      filename,
      size: blob.size,
      mimeType: 'application/pdf',
      content: blob,
    };
    
    return evidence;
  } catch (error) {
    console.error('Failed to generate PDF document:', error);
    throw new Error(`Failed to generate PDF document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Capture log data as evidence
 * 
 * @param logData The log data to capture
 * @param testId The ID of the validation test
 * @param description A description of the evidence
 * @returns The evidence object
 */
export function captureLog(
  logData: string,
  testId: string,
  description: string
): Evidence {
  try {
    // Convert the log data to a blob
    const blob = new Blob([logData], { type: 'text/plain' });
    
    // Create a unique filename
    const timestamp = new Date().toISOString();
    const filename = `log-${testId}-${timestamp.replace(/[:.]/g, '-')}.txt`;
    
    // Create the evidence object
    const evidence: Evidence = {
      id: uuidv4(),
      testId,
      type: EvidenceType.Log,
      description,
      timestamp,
      filename,
      size: blob.size,
      mimeType: 'text/plain',
      content: blob,
    };
    
    return evidence;
  } catch (error) {
    console.error('Failed to capture log:', error);
    throw new Error(`Failed to capture log: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Upload evidence to the server
 * 
 * @param evidence The evidence to upload
 * @returns Promise resolving to the API response
 */
export async function uploadEvidence(evidence: Evidence): Promise<Response> {
  if (!evidence.content) {
    throw new Error('Evidence content is missing');
  }
  
  // Create a FormData object to upload the evidence
  const formData = new FormData();
  formData.append('file', evidence.content, evidence.filename);
  formData.append('type', evidence.type);
  formData.append('description', evidence.description);
  formData.append('testId', evidence.testId);
  
  // Upload the evidence to the server
  return fetch(`/api/design-control/validation-tests/${evidence.testId}/evidence`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Collect multiple types of evidence for a validation test
 * 
 * @param test The validation test
 * @param elements Map of element IDs to capture as screenshots
 * @param logs Map of log names to log content
 * @param documents Map of document titles to content
 * @returns Promise resolving to an array of uploaded evidence
 */
export async function collectAndUploadEvidence(
  test: ValidationTest,
  elements: Record<string, HTMLElement> = {},
  logs: Record<string, string> = {},
  documents: Record<string, { title: string, content: string | HTMLElement }> = {}
): Promise<any[]> {
  try {
    const evidenceItems: Evidence[] = [];
    
    // Capture screenshots
    for (const [name, element] of Object.entries(elements)) {
      if (element) {
        const screenshot = await captureScreenshot(
          element,
          test.id,
          `Screenshot of ${name}`
        );
        evidenceItems.push(screenshot);
      }
    }
    
    // Capture logs
    for (const [name, content] of Object.entries(logs)) {
      const log = captureLog(
        content,
        test.id,
        `Log data: ${name}`
      );
      evidenceItems.push(log);
    }
    
    // Generate documents
    for (const [name, docInfo] of Object.entries(documents)) {
      const document = await generatePDFDocument(
        docInfo.title,
        docInfo.content,
        test.id,
        `Document: ${name}`
      );
      evidenceItems.push(document);
    }
    
    // Upload all evidence items
    const uploads = evidenceItems.map(async (evidence) => {
      try {
        return await registerEvidence(test.id, evidence);
      } catch (err) {
        console.error(`Failed to upload evidence: ${evidence.filename}`, err);
        return null;
      }
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploads);
    
    // Filter out failed uploads
    return results.filter(Boolean);
  } catch (error) {
    console.error('Failed to collect and upload evidence:', error);
    throw new Error(`Failed to collect evidence: ${error instanceof Error ? error.message : String(error)}`);
  }
}